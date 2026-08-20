-- =============================================================================
-- Jeu d'essai. Exécuté en superutilisateur : RLS est contourné, c'est voulu —
-- on prépare l'état, on ne teste rien ici.
-- =============================================================================

-- Collecteur de résultats. `security definer` sur t() pour qu'un rôle
-- applicatif puisse consigner un résultat sans avoir de droits sur la table.
create table if not exists test_results (label text, ok boolean, seq serial);

create or replace function t(label text, ok boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into test_results (label, ok) values (label, ok);
end;
$$;

grant execute on function t(text, boolean) to anon, authenticated;

-- --- Identités -------------------------------------------------------------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@test.cm'),
  ('00000000-0000-0000-0000-0000000000b1', 'owner1@test.cm'),
  ('00000000-0000-0000-0000-0000000000b2', 'owner2@test.cm'),
  ('00000000-0000-0000-0000-0000000000c1', 'tenant-paye@test.cm'),
  ('00000000-0000-0000-0000-0000000000c2', 'tenant-non-paye@test.cm');

-- `on conflict do update` et non un simple insert : depuis la migration 0004,
-- un déclencheur crée déjà le profil à l'insertion dans auth.users. On ajuste
-- donc le rôle plutôt que de recréer la ligne.
-- Ce comportement est lui-même une vérification : si le déclencheur cessait de
-- fonctionner, l'insertion ci-dessus créerait les profils et rien ne le
-- signalerait — d'où le contrôle explicite qui suit.
do $$
declare n int;
begin
  select count(*) into n from profiles;
  if n <> 5 then
    raise exception 'le declencheur 0004 n''a pas cree les 5 profils attendus (% trouves)', n;
  end if;
end $$;

insert into profiles (id, role, full_name, is_approved) values
  ('00000000-0000-0000-0000-0000000000a1', 'ADMIN',  'Admin',            true),
  ('00000000-0000-0000-0000-0000000000b1', 'OWNER',  'Proprietaire Un',  true),
  ('00000000-0000-0000-0000-0000000000b2', 'OWNER',  'Proprietaire Deux',true),
  ('00000000-0000-0000-0000-0000000000c1', 'TENANT', 'Locataire Paye',   true),
  ('00000000-0000-0000-0000-0000000000c2', 'TENANT', 'Locataire Non Paye', true)
on conflict (id) do update
  set role = excluded.role,
      full_name = excluded.full_name,
      is_approved = excluded.is_approved;

-- --- Référentiel -----------------------------------------------------------
-- Les quartiers viennent de la migration 0003, ils ne sont PAS redéfinis ici :
-- un jeu d'essai qui duplique une donnée de référence finit par diverger
-- d'elle, et le test valide alors un monde qui n'existe pas.
do $$
begin
  if (select count(*) from neighborhoods) = 0 then
    raise exception 'referentiel des quartiers vide — la migration 0003 n''a pas ete appliquee';
  end if;
end $$;

-- --- Logements -------------------------------------------------------------
-- listing1 : actif, propriétaire 1. listing2 : INACTIF, propriétaire 2.
insert into listings (id, owner_id, neighborhood_id, title, landmark,
                      price_per_night, listing_type, is_active) values
  ('00000000-0000-0000-0000-0000000000e1',
   '00000000-0000-0000-0000-0000000000b1',
   (select id from neighborhoods where name = 'Akwa'),
   'Studio climatise Akwa', 'pres du carrefour', 20000, 'STUDIO', true),
  ('00000000-0000-0000-0000-0000000000e2',
   '00000000-0000-0000-0000-0000000000b2',
   (select id from neighborhoods where name = 'Bepanda'),
   'Chambre meublee Bepanda', 'en bord de route', 16500, 'ROOM', false);

insert into listing_contacts (listing_id, exact_address, contact_phone) values
  ('00000000-0000-0000-0000-0000000000e1',
   'Rue 1.234, immeuble Balla, 3e etage, porte 7', '+237 6 99 00 11 22');

-- --- Réservations ----------------------------------------------------------
-- c1 a PAYÉ (CONFIRMED). c2 est seulement ACCEPTED : c'est le cas qui décide
-- du modèle économique — il ne doit PAS voir les coordonnées.
insert into bookings (id, tenant_id, listing_id, check_in, check_out,
                      nights, total_amount, deposit_amount, status) values
  ('00000000-0000-0000-0000-0000000000f1',
   '00000000-0000-0000-0000-0000000000c1',
   '00000000-0000-0000-0000-0000000000e1',
   date '2026-09-10', date '2026-09-13', 3, 60000, 18000, 'CONFIRMED'),
  ('00000000-0000-0000-0000-0000000000f2',
   '00000000-0000-0000-0000-0000000000c2',
   '00000000-0000-0000-0000-0000000000e1',
   date '2026-10-01', date '2026-10-04', 3, 60000, 18000, 'ACCEPTED');

-- Blocage correspondant à la réservation confirmée.
insert into listing_blocks (listing_id, period, booking_id) values
  ('00000000-0000-0000-0000-0000000000e1',
   daterange(date '2026-09-10', date '2026-09-13', '[)'),
   '00000000-0000-0000-0000-0000000000f1');
