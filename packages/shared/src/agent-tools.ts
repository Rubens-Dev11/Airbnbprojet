/**
 * Outils de l'agent conversationnel.
 *
 * Volontairement SÉPARÉS du modèle de langage : ce sont des fonctions pures
 * sur la base de données, testables sans aucune clé d'API. C'est la partie qui
 * décide de la pertinence des réponses — si `search_listings` ne trouve pas un
 * logement qui existe, aucun modèle ne rattrapera l'erreur.
 *
 * Le critère S3 du PRD — « ≥ 80 % des requêtes produisent un résultat
 * pertinent » — se joue ici d'abord.
 */

/** Client Supabase minimal attendu. Typé structurellement pour rester testable. */
type Db = {
  from: (table: string) => any;
};

export type ListingHit = {
  id: string;
  title: string;
  neighborhood: string;
  pricePerNight: number;
  listingType: string;
  maxGuests: number;
  amenities: string[];
  landmark: string | null;
};

export type SearchCriteria = {
  /** Texte libre : « akwa », « vers Bonanjo », « bepanda tapis rouge ». */
  neighborhood?: string;
  maxPrice?: number;
  minPrice?: number;
  listingType?: string;
  amenities?: string[];
  guests?: number;
  checkIn?: string;
  checkOut?: string;
};

export type SearchOutcome = {
  results: ListingHit[];
  /** Critères effectivement appliqués — ce que l'agent doit annoncer. */
  applied: SearchCriteria;
  /**
   * Critères RELÂCHÉS faute de résultat. L'agent doit le dire à
   * l'utilisateur : proposer un logement hors budget sans le signaler est
   * une réponse fausse, pas une alternative.
   */
  relaxed: (keyof SearchCriteria)[];
  /** Quartier demandé mais introuvable au référentiel. */
  unknownNeighborhood?: string;
};

/**
 * Fait correspondre un texte libre à un quartier du référentiel.
 *
 * Sans cette étape, « akwa nord » ne trouve rien alors que le quartier existe.
 * C'est le premier endroit où une recherche conversationnelle se dégrade.
 */
export async function resolveNeighborhood(
  db: Db,
  input: string,
): Promise<{ id: string; name: string } | null> {
  const needle = input.trim().toLowerCase();
  if (!needle) return null;

  const { data } = await db
    .from('neighborhoods')
    .select('id, name, aliases')
    .eq('is_active', true);

  if (!data) return null;

  const rows = data as { id: string; name: string; aliases: string[] }[];

  // 1. Correspondance exacte sur le nom.
  const exact = rows.find((r) => r.name.toLowerCase() === needle);
  if (exact) return { id: exact.id, name: exact.name };

  // 2. Correspondance exacte sur un alias.
  const byAlias = rows.find((r) => r.aliases.some((a) => a.toLowerCase() === needle));
  if (byAlias) return { id: byAlias.id, name: byAlias.name };

  // 3. Le texte contient le nom, ou le nom contient le texte.
  //    Couvre « vers Akwa », « quartier Bonanjo », « akwa » pour « Akwa ».
  const partial = rows.find(
    (r) =>
      needle.includes(r.name.toLowerCase()) ||
      r.name.toLowerCase().includes(needle) ||
      r.aliases.some((a) => needle.includes(a.toLowerCase()) || a.toLowerCase().includes(needle)),
  );
  if (partial) return { id: partial.id, name: partial.name };

  return null;
}

/**
 * Recherche des logements.
 *
 * Ne renvoie QUE des annonces actives et réellement libres aux dates
 * demandées. Proposer un logement indisponible est pire que ne rien proposer :
 * l'utilisateur le découvre au moment de réserver.
 *
 * Si aucun résultat, relâche les critères dans un ordre choisi — et dit
 * lesquels. Le prix en dernier : c'est celui qui compte le plus pour la cible.
 */
export async function searchListings(
  db: Db,
  criteria: SearchCriteria,
  limit = 6,
): Promise<SearchOutcome> {
  const applied: SearchCriteria = { ...criteria };
  let unknownNeighborhood: string | undefined;
  let neighborhoodId: string | undefined;

  if (criteria.neighborhood) {
    const resolved = await resolveNeighborhood(db, criteria.neighborhood);
    if (resolved) {
      neighborhoodId = resolved.id;
      applied.neighborhood = resolved.name;
    } else {
      unknownNeighborhood = criteria.neighborhood;
      delete applied.neighborhood;
    }
  }

  // Ordre de relâchement : équipements d'abord (le moins structurant), le
  // prix en dernier. Chaque tour retire un critère supplémentaire.
  const relaxationOrder: (keyof SearchCriteria)[] = [
    'amenities',
    'listingType',
    'guests',
    'neighborhood',
    'maxPrice',
  ];

  const relaxed: (keyof SearchCriteria)[] = [];

  for (let step = 0; step <= relaxationOrder.length; step += 1) {
    const dropped = new Set(relaxationOrder.slice(0, step));

    let query = db
      .from('listings')
      .select(
        'id, title, price_per_night, listing_type, max_guests, amenities, landmark, neighborhoods(name)',
      )
      .eq('is_active', true);

    if (neighborhoodId && !dropped.has('neighborhood')) {
      query = query.eq('neighborhood_id', neighborhoodId);
    }
    if (criteria.maxPrice && !dropped.has('maxPrice')) {
      query = query.lte('price_per_night', criteria.maxPrice);
    }
    if (criteria.minPrice) {
      query = query.gte('price_per_night', criteria.minPrice);
    }
    if (criteria.listingType && !dropped.has('listingType')) {
      query = query.eq('listing_type', criteria.listingType);
    }
    if (criteria.guests && !dropped.has('guests')) {
      query = query.gte('max_guests', criteria.guests);
    }
    if (criteria.amenities?.length && !dropped.has('amenities')) {
      query = query.contains('amenities', criteria.amenities);
    }

    const { data } = await query.order('price_per_night').limit(limit * 3);
    let rows = (data ?? []) as any[];

    // Filtre de disponibilité : jamais proposer un logement déjà pris.
    if (criteria.checkIn && criteria.checkOut && rows.length > 0) {
      const free = await filterAvailable(
        db,
        rows.map((r) => r.id as string),
        criteria.checkIn,
        criteria.checkOut,
      );
      rows = rows.filter((r) => free.has(r.id as string));
    }

    if (rows.length > 0 || step === relaxationOrder.length) {
      for (const key of relaxationOrder.slice(0, step)) {
        if (criteria[key] !== undefined) relaxed.push(key);
      }
      return {
        results: rows.slice(0, limit).map(toHit),
        applied,
        relaxed,
        unknownNeighborhood,
      };
    }
  }

  return { results: [], applied, relaxed, unknownNeighborhood };
}

/** Identifiants des logements libres sur l'intervalle [checkIn, checkOut). */
export async function filterAvailable(
  db: Db,
  listingIds: string[],
  checkIn: string,
  checkOut: string,
): Promise<Set<string>> {
  if (listingIds.length === 0) return new Set();

  // `listing_blocks` centralise TOUTES les périodes bloquées — réservations
  // confirmées comme blocages manuels. Une seule table à interroger, donc
  // aucun risque d'en oublier une.
  const { data } = await db
    .from('listing_blocks')
    .select('listing_id, period')
    .in('listing_id', listingIds)
    .overlaps('period', `[${checkIn},${checkOut})`);

  const busy = new Set((data ?? []).map((b: { listing_id: string }) => b.listing_id));
  return new Set(listingIds.filter((id) => !busy.has(id)));
}

export async function getListing(db: Db, id: string): Promise<ListingHit | null> {
  const { data } = await db
    .from('listings')
    .select(
      'id, title, description, price_per_night, listing_type, max_guests, amenities, landmark, neighborhoods(name)',
    )
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();

  return data ? toHit(data) : null;
}

function toHit(row: any): ListingHit {
  return {
    id: row.id,
    title: row.title,
    neighborhood: row.neighborhoods?.name ?? '—',
    pricePerNight: row.price_per_night,
    listingType: row.listing_type,
    maxGuests: row.max_guests,
    amenities: row.amenities ?? [],
    landmark: row.landmark ?? null,
  };
}
