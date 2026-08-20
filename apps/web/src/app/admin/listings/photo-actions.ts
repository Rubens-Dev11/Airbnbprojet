'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server.ts';
import { requireAdmin } from '@/lib/auth.ts';

export type UploadResult = { ok: true; added: number } | { ok: false; error: string };

const BUCKET = 'listing-photos';
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Téléverse des photos et les rattache à une annonce.
 *
 * Le contrôle de type et de taille est refait ici alors que le compartiment
 * les impose déjà : une erreur du service de stockage arrive sans contexte,
 * tandis qu'un refus ici nomme le fichier fautif. L'un protège, l'autre
 * explique — il faut les deux.
 */
export async function uploadListingPhotos(
  _prev: unknown,
  formData: FormData,
): Promise<UploadResult> {
  await requireAdmin();

  const listingId = String(formData.get('listing_id') ?? '');
  if (!listingId) return { ok: false, error: 'Annonce introuvable.' };

  const files = formData.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { ok: false, error: 'Aucun fichier sélectionné.' };

  const supabase = await createClient();

  // Position de départ : on ajoute à la suite, sans réordonner l'existant.
  const { data: existing } = await supabase
    .from('listing_images')
    .select('position')
    .eq('listing_id', listingId)
    .order('position', { ascending: false })
    .limit(1);

  let position = (existing?.[0]?.position ?? -1) + 1;
  let added = 0;

  for (const file of files) {
    if (!ALLOWED.includes(file.type)) {
      return { ok: false, error: `« ${file.name} » : format ${file.type || 'inconnu'} refusé (JPEG, PNG ou WebP).` };
    }
    if (file.size > MAX_BYTES) {
      const mo = (file.size / 1024 / 1024).toFixed(1);
      return {
        ok: false,
        error: `« ${file.name} » fait ${mo} Mo, la limite est de 5 Mo. Le marché cible est en 3G (CDC §9).`,
      };
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${listingId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      return {
        ok: false,
        error:
          added > 0
            ? `${added} photo(s) ajoutée(s), puis échec sur « ${file.name} » : ${uploadError.message}`
            : `Téléversement refusé : ${uploadError.message}`,
      };
    }

    const { error: rowError } = await supabase
      .from('listing_images')
      .insert({ listing_id: listingId, storage_path: path, position });

    // Le fichier est déposé mais non référencé : on le retire plutôt que de
    // laisser un objet orphelin que plus rien ne désigne.
    if (rowError) {
      await supabase.storage.from(BUCKET).remove([path]);
      return { ok: false, error: `Enregistrement refusé : ${rowError.message}` };
    }

    position += 1;
    added += 1;
  }

  revalidatePath(`/admin/listings/${listingId}`);
  revalidatePath('/admin/listings');
  return { ok: true, added };
}

/** Supprime une photo : la ligne ET le fichier. */
export async function deleteListingPhoto(imageId: string): Promise<UploadResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: image, error } = await supabase
    .from('listing_images')
    .select('id, listing_id, storage_path')
    .eq('id', imageId)
    .single();

  if (error || !image) return { ok: false, error: 'Photo introuvable.' };

  const { error: deleteError } = await supabase.from('listing_images').delete().eq('id', imageId);
  if (deleteError) return { ok: false, error: deleteError.message };

  // Si la ligne part mais pas le fichier, on garde un objet payé et invisible.
  // On le signale plutôt que de le taire.
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([image.storage_path]);

  revalidatePath(`/admin/listings/${image.listing_id}`);
  if (storageError) {
    return { ok: false, error: `Photo retirée de l’annonce, mais fichier non supprimé : ${storageError.message}` };
  }
  return { ok: true, added: 0 };
}
