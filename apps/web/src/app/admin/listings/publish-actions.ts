'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server.ts';
import { requireAdmin } from '@/lib/auth.ts';

export type ToggleResult = { ok: true; isActive: boolean } | { ok: false; error: string };

/**
 * Publie ou dépublie une annonce.
 *
 * Sans cette action, une annonce naissait en brouillon et rien ne pouvait la
 * mettre en ligne : on pouvait saisir vingt annonces et n'en montrer aucune.
 * Manque constaté le 7 août 2026 en regardant l'écran, pas en lisant le code.
 *
 * Autorisation vérifiée ICI : une Server Action est joignable par POST direct.
 * Et si ce contrôle sautait, la politique `listings_admin_write` refuserait
 * quand même l'écriture.
 */
export async function toggleListingPublication(
  listingId: string,
  nextState: boolean,
): Promise<ToggleResult> {
  await requireAdmin();

  const supabase = await createClient();

  // Une annonce publiée sans photo est une fiche que personne ne réservera :
  // le CDC §1 identifie « photos inexistantes ou trompeuses » comme un
  // problème central du marché. On refuse la publication plutôt que de
  // laisser sortir une fiche muette.
  if (nextState) {
    const { count, error: countError } = await supabase
      .from('listing_images')
      .select('*', { count: 'exact', head: true })
      .eq('listing_id', listingId);

    if (countError) return { ok: false, error: `Vérification impossible : ${countError.message}` };
    if (!count) {
      return {
        ok: false,
        error: 'Publication refusée : cette annonce n’a aucune photo.',
      };
    }
  }

  const { error } = await supabase
    .from('listings')
    .update({ is_active: nextState })
    .eq('id', listingId);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/listings');
  revalidatePath('/');
  return { ok: true, isActive: nextState };
}
