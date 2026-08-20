'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { AMENITIES, type Amenity, type ListingType } from '@app/shared';
import { createClient } from '@/lib/supabase/server.ts';
import { requireAdmin } from '@/lib/auth.ts';

export type ActionResult = { ok: false; error: string };

const LISTING_TYPES: readonly ListingType[] = ['ROOM', 'STUDIO', 'APARTMENT', 'VILLA'];

/**
 * Crée une annonce.
 *
 * Au MVP, seul un administrateur peut créer une annonce : l'équipe saisit les
 * 30 à 50 premières pour amorcer le catalogue (ADR-008). L'auto-publication
 * par le propriétaire est en Phase 2.
 *
 * L'autorisation est vérifiée ICI, à l'intérieur de l'action, parce qu'une
 * Server Action est joignable par un POST direct sans passer par l'écran.
 * Et même si ce contrôle sautait, la politique RLS `listings_admin_write`
 * refuserait l'écriture.
 */
export async function createListing(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const title = str(formData, 'title');
  const neighborhoodId = str(formData, 'neighborhood_id');
  const ownerId = str(formData, 'owner_id');
  const listingType = str(formData, 'listing_type');
  const priceRaw = str(formData, 'price_per_night');
  const maxGuestsRaw = str(formData, 'max_guests');

  if (!title) return { ok: false, error: 'Le titre est obligatoire.' };
  if (!neighborhoodId) return { ok: false, error: 'Le quartier est obligatoire.' };
  if (!ownerId) return { ok: false, error: 'Le propriétaire est obligatoire.' };

  if (!LISTING_TYPES.includes(listingType as ListingType)) {
    return { ok: false, error: 'Type de logement invalide.' };
  }

  // Le FCFA n'a pas de décimales : on refuse tout ce qui n'est pas un entier
  // plutôt que d'arrondir en silence.
  const price = Number(priceRaw);
  if (!Number.isInteger(price) || price <= 0) {
    return { ok: false, error: 'Le prix doit être un nombre entier de FCFA, supérieur à 0.' };
  }

  const maxGuests = Number(maxGuestsRaw || '2');
  if (!Number.isInteger(maxGuests) || maxGuests <= 0) {
    return { ok: false, error: 'Le nombre de personnes doit être un entier supérieur à 0.' };
  }

  // On ne garde que les équipements connus : une valeur libre rendrait le
  // logement invisible aux filtres et à l'agent.
  const amenities = formData
    .getAll('amenities')
    .map(String)
    .filter((a): a is Amenity => (AMENITIES as readonly string[]).includes(a));

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('listings')
    .insert({
      title,
      description: str(formData, 'description'),
      landmark: str(formData, 'landmark') || null,
      neighborhood_id: neighborhoodId,
      owner_id: ownerId,
      listing_type: listingType as ListingType,
      price_per_night: price,
      max_guests: maxGuests,
      amenities,
      // Une annonce naît INACTIVE : elle n'apparaît publiquement qu'après
      // relecture. Publier par défaut ferait sortir des fiches incomplètes.
      is_active: false,
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: `Création refusée : ${error.message}` };

  // Coordonnées exactes : table séparée, protégée par RLS jusqu'au paiement
  // de l'avance (ADR-007).
  const exactAddress = str(formData, 'exact_address');
  const contactPhone = str(formData, 'contact_phone');

  if (exactAddress && contactPhone) {
    const { error: contactError } = await supabase.from('listing_contacts').insert({
      listing_id: data.id,
      exact_address: exactAddress,
      contact_phone: contactPhone,
      access_notes: str(formData, 'access_notes') || null,
    });

    // L'annonce existe, ses coordonnées non. On le DIT plutôt que de laisser
    // croire à un succès complet : une annonce sans coordonnées bloque la
    // réservation au dernier moment, et le défaut serait découvert par le
    // premier locataire.
    if (contactError) {
      return {
        ok: false,
        error: `Annonce créée (${data.id}) mais coordonnées NON enregistrées : ${contactError.message}`,
      };
    }
  }

  revalidatePath('/admin/listings');

  // Redirection vers la fiche, et non un simple message de succès.
  //
  // Une photo doit être rattachée à un `listing_id`, qui n'existe pas avant
  // l'enregistrement : le parcours est donc nécessairement en deux temps. Mais
  // annoncer « annonce créée » puis laisser l'utilisateur chercher où ajouter
  // les photos fait de la seconde étape une impasse. Constaté le 7 août 2026,
  // la question ayant été posée directement : « où est l'espace pour
  // téléverser les photos ? »
  //
  // `redirect()` lève une exception de contrôle interne à Next : elle doit
  // rester HORS de tout try/catch, sinon elle est avalée et la redirection
  // n'a pas lieu.
  redirect(`/admin/listings/${data.id}?nouvelle=1`);
}

function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}
