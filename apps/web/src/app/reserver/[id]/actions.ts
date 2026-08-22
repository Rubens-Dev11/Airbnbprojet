'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server.ts';
import { calculerMontants, compterNuits } from '@/lib/pricing.ts';

export type ReservationResult = { ok: false; error: string };

/**
 * Crée une demande de réservation.
 *
 * L'autorisation est vérifiée ICI, à l'intérieur de l'action : une Server
 * Action est joignable par un POST direct. Et si ce contrôle sautait, la
 * politique `bookings_insert_own` refuserait quand même une demande au nom
 * d'un autre — vérifié par test (`pnpm db:test`).
 *
 * Les montants sont recalculés SERVEUR à partir du prix en base. Rien de ce
 * qui vient du formulaire n'est cru sur parole : un champ caché contenant le
 * prix serait modifiable par le client.
 */
export async function creerDemande(
  _prev: unknown,
  formData: FormData,
): Promise<ReservationResult> {
  const listingId = String(formData.get('listing_id') ?? '');
  const arrivee = String(formData.get('arrivee') ?? '');
  const depart = String(formData.get('depart') ?? '');
  const message = String(formData.get('message') ?? '').trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Le parcours ne doit pas casser : on revient exactement ici après
  // connexion, dates comprises (PRD US-008).
  if (!user) {
    const suite = `/reserver/${listingId}?arrivee=${arrivee}&depart=${depart}`;
    redirect(`/connexion?suite=${encodeURIComponent(suite)}`);
  }

  const nuits = compterNuits(arrivee, depart);
  if (nuits === null) {
    return { ok: false, error: 'Les dates ne sont pas valides : le départ doit suivre l’arrivée.' };
  }

  const aujourdhui = new Date().toISOString().slice(0, 10);
  if (arrivee < aujourdhui) {
    return { ok: false, error: 'La date d’arrivée est déjà passée.' };
  }

  const { data: listing } = await supabase
    .from('listings')
    .select('id, price_per_night')
    .eq('id', listingId)
    .eq('is_active', true)
    .maybeSingle();

  if (!listing) {
    return { ok: false, error: 'Ce logement n’est plus disponible à la réservation.' };
  }

  // Disponibilité vérifiée juste avant l'insertion. Ce n'est PAS une garantie :
  // deux demandes simultanées passeraient toutes deux ici. La garantie réelle
  // est la contrainte d'exclusion sur `listing_blocks`, qui s'applique au
  // moment de la confirmation. Ce contrôle évite une demande manifestement
  // vouée à l'échec, il ne remplace pas la base.
  const { data: pris } = await supabase
    .from('listing_blocks')
    .select('id')
    .eq('listing_id', listingId)
    .overlaps('period', `[${arrivee},${depart})`)
    .limit(1);

  if (pris && pris.length > 0) {
    return { ok: false, error: 'Ce logement est déjà pris sur ces dates.' };
  }

  const { total, avance } = calculerMontants(listing.price_per_night, nuits);

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      tenant_id: user.id,
      listing_id: listingId,
      check_in: arrivee,
      check_out: depart,
      nights: nuits,
      total_amount: total,
      deposit_amount: avance,
      message: message || null,
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: `Demande refusée : ${error.message}` };

  redirect(`/reservations/${booking.id}?nouvelle=1`);
}
