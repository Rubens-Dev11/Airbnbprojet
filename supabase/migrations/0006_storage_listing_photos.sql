-- =============================================================================
-- 0006 — Stockage des photos de logements
--
-- Remplace Cloudinary prévu au CDC §6 (ADR-004) : un fournisseur et une clé
-- d'API de moins.
--
-- Le compartiment est PUBLIC en lecture : une photo de logement est une donnée
-- publique, au même titre que le prix. Elle n'est pas une coordonnée — celles-ci
-- vivent dans `listing_contacts` et restent masquées jusqu'au paiement
-- (ADR-007). Confondre les deux protégerait la mauvaise chose : des photos
-- privées empêcheraient le référencement, qui est le seul canal d'acquisition
-- gratuit face à PUOL (ADR-003).
--
-- L'écriture, elle, est réservée aux administrateurs : au MVP l'équipe saisit
-- les annonces (ADR-008).
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-photos',
  'listing-photos',
  true,
  -- 5 Mo. Le CDC §9 vise une connexion 3G : accepter des photos de 20 Mo
  -- garantirait des fiches inutilisables sur le marché cible.
  5 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Lecture publique : nécessaire pour que les fiches soient indexables.
drop policy if exists listing_photos_read_public on storage.objects;
create policy listing_photos_read_public on storage.objects
  for select using (bucket_id = 'listing-photos');

-- Écriture réservée aux administrateurs.
drop policy if exists listing_photos_admin_write on storage.objects;
create policy listing_photos_admin_write on storage.objects
  for all
  using (bucket_id = 'listing-photos' and public.is_admin())
  with check (bucket_id = 'listing-photos' and public.is_admin());
