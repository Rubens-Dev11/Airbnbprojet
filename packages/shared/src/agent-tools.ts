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
  /** Libellé français prêt à énoncer — voir `amenities`. */
  listingType: string;
  maxGuests: number;
  /**
   * Libellés FRANÇAIS, pas les codes.
   *
   * Le 22 août 2026, l'outil renvoyait les codes bruts (`AC`, `WATER_HEATER`)
   * et le modèle les traduisait lui-même : il a inventé un « réfrigérateur »
   * et un « générateur » absents, tout en OUBLIANT la climatisation qui, elle,
   * existait. On ne demande pas à un modèle de traduire un vocabulaire
   * contrôlé — on le lui donne déjà traduit. Il n'a plus rien à deviner.
   */
  amenities: string[];
  landmark: string | null;
  /**
   * Équipements DEMANDÉS que ce logement n'a pas, en français.
   *
   * Renseigné uniquement quand la recherche a dû relâcher les équipements.
   * Sans ce champ, le modèle ne peut pas distinguer un logement conforme d'un
   * logement proposé par défaut — et il tranche en affirmant qu'il est
   * conforme.
   */
  missing?: string[];
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
  /**
   * Phrase française PRÊTE À DIRE quand des critères ont été relâchés.
   *
   * Mesuré le 22 août 2026 : à qui on donne seulement `relaxed: ["amenities"]`,
   * le modèle répond « plusieurs logements correspondent à vos critères » et
   * cite des logements sans parking. Il ne déduit pas, il affirme.
   *
   * On lui donne donc la phrase toute faite, comme pour les libellés
   * d'équipements. Même principe, même raison : ce que le modèle ne doit pas
   * inventer, on le lui écrit.
   */
  warning?: string;
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

      const hits = rows.slice(0, limit).map(toHit);

      // Quand les équipements ont été relâchés, on dit pour CHAQUE logement
      // ce qui lui manque. Un « certains n'ont pas tout » global laisserait
      // le modèle deviner lequel — et il devinerait mal.
      if (relaxed.includes('amenities') && criteria.amenities?.length) {
        const demandes = criteria.amenities.map((c) => LIBELLES_EQUIPEMENTS[c] ?? c);
        for (const hit of hits) {
          const absents = demandes.filter((d) => !hit.amenities.includes(d));
          if (absents.length > 0) hit.missing = absents;
        }
      }

      return {
        results: hits,
        applied,
        relaxed,
        warning: composerAvertissement(relaxed, criteria),
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

/** Nom français de chaque critère, pour l'avertissement. */
const LIBELLES_CRITERES: Record<string, string> = {
  maxPrice: 'le budget maximum',
  listingType: 'le type de logement',
  guests: 'le nombre de personnes',
  neighborhood: 'le quartier',
  amenities: 'les équipements demandés',
};

/**
 * Rédige l'avertissement que l'agent doit répéter tel quel.
 *
 * Écrit ici et pas dans la consigne système : une consigne se contourne, une
 * phrase fournie se recopie.
 */
function composerAvertissement(
  relaxed: (keyof SearchCriteria)[],
  criteria: SearchCriteria,
): string | undefined {
  if (relaxed.length === 0) return undefined;

  const noms = relaxed.map((r) => LIBELLES_CRITERES[r] ?? String(r));
  const liste =
    noms.length === 1 ? noms[0] : `${noms.slice(0, -1).join(', ')} et ${noms.at(-1)}`;

  // Cette phrase est LUE PAR UN UTILISATEUR, pas par une machine.
  //
  // La première version disait « chaque logement indique dans son champ
  // "missing" … ». Le modèle, à qui on demande de la répéter telle quelle,
  // l'a récitée mot pour mot — nom de champ compris. Constaté le 22 août 2026.
  // Aucun vocabulaire technique ici : ce qui concerne le modèle va dans la
  // description de l'outil, pas dans une phrase destinée au public.
  let phrase = `Aucun logement ne correspond exactement à cette demande. J'ai élargi ${liste} pour montrer ce qui existe.`;

  if (relaxed.includes('maxPrice') && criteria.maxPrice) {
    phrase += ` Les logements ci-dessous dépassent ${criteria.maxPrice.toLocaleString('fr-FR')} FCFA la nuit.`;
  }
  if (relaxed.includes('amenities')) {
    phrase += " Ils n'ont pas tous les équipements demandés — c'est précisé pour chacun.";
  }

  return phrase;
}

/** Vocabulaire contrôlé, traduit ici et nulle part ailleurs. */
const LIBELLES_EQUIPEMENTS: Record<string, string> = {
  WIFI: 'WiFi',
  AC: 'climatisation',
  PARKING: 'parking',
  KITCHEN: 'cuisine équipée',
  WATER_HEATER: 'chauffe-eau',
  TV: 'télévision',
  WASHING_MACHINE: 'machine à laver',
  GENERATOR: 'groupe électrogène',
  SECURITY: 'gardiennage',
};

const LIBELLES_TYPES: Record<string, string> = {
  ROOM: 'chambre',
  STUDIO: 'studio',
  APARTMENT: 'appartement',
  VILLA: 'villa',
};

function toHit(row: any): ListingHit {
  const codes: string[] = row.amenities ?? [];
  return {
    id: row.id,
    title: row.title,
    neighborhood: row.neighborhoods?.name ?? '—',
    pricePerNight: row.price_per_night,
    listingType: LIBELLES_TYPES[row.listing_type] ?? row.listing_type,
    maxGuests: row.max_guests,
    // Un code inconnu est conservé tel quel plutôt que masqué : mieux vaut un
    // libellé bizarre qu'un équipement qui disparaît silencieusement.
    amenities: codes.map((c) => LIBELLES_EQUIPEMENTS[c] ?? c),
    landmark: row.landmark ?? null,
  };
}
