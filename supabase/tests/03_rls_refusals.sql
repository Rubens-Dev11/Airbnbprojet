-- =============================================================================
-- Tests de REFUS — exigés par ADR-004
--
-- « Une politique qui n'a jamais bloqué personne n'a jamais été testée. »
-- On vérifie ici ce qui doit ÊTRE INTERDIT. Les autorisations sont testées
-- aussi, mais seulement comme témoins : sans elles, un refus généralisé
-- passerait pour un succès.
-- =============================================================================

\set ON_ERROR_STOP on

\set admin   '''00000000-0000-0000-0000-0000000000a1'''
\set owner1  '''00000000-0000-0000-0000-0000000000b1'''
\set owner2  '''00000000-0000-0000-0000-0000000000b2'''
\set paye    '''00000000-0000-0000-0000-0000000000c1'''
\set nonpaye '''00000000-0000-0000-0000-0000000000c2'''
\set list1   '''00000000-0000-0000-0000-0000000000e1'''
\set list2   '''00000000-0000-0000-0000-0000000000e2'''

-- =============================================================================
-- 1. LA règle qui porte le modèle économique
-- =============================================================================

-- 1a. Visiteur anonyme : aucune coordonnée.
set role anon;
select set_config('request.jwt.claims', '', false);
select t('REFUS  anonyme ne voit aucune coordonnee',
         (select count(*) from listing_contacts) = 0);
select t('AUTORISE anonyme voit les annonces actives',
         (select count(*) from listings) = 1);
select t('REFUS  anonyme ne voit pas l''annonce inactive',
         (select count(*) from listings where id = :list2) = 0);
select t('REFUS  anonyme ne lit aucun profil',
         (select count(*) from profiles) = 0);
reset role;

-- 1b. LE CAS DÉCISIF : locataire dont l'avance n'est PAS vérifiée.
-- Sa réservation est ACCEPTED. S'il voit l'adresse ici, la plateforme est un
-- annuaire gratuit et le modèle économique ne tient pas.
set role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :nonpaye)::text, false);
select t('REFUS  locataire ACCEPTED (non paye) ne voit PAS les coordonnees',
         (select count(*) from listing_contacts where listing_id = :list1) = 0);
reset role;

-- 1c. Témoin : locataire dont l'avance est vérifiée.
set role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :paye)::text, false);
select t('AUTORISE locataire CONFIRMED voit les coordonnees',
         (select count(*) from listing_contacts where listing_id = :list1) = 1);
reset role;

-- =============================================================================
-- 2. Cloisonnement des propriétaires (CDC §9)
-- =============================================================================

set role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :owner1)::text, false);
select t('REFUS  proprietaire 1 ne voit pas l''annonce inactive du proprietaire 2',
         (select count(*) from listings where id = :list2) = 0);
select t('AUTORISE proprietaire 1 voit son propre logement',
         (select count(*) from listings where id = :list1) = 1);
select t('AUTORISE proprietaire 1 voit les demandes sur son logement',
         (select count(*) from bookings where listing_id = :list1) = 2);
reset role;

set role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :owner2)::text, false);
select t('REFUS  proprietaire 2 ne voit pas les demandes du proprietaire 1',
         (select count(*) from bookings) = 0);
select t('REFUS  proprietaire 2 ne voit pas les coordonnees du logement 1',
         (select count(*) from listing_contacts) = 0);
reset role;

-- =============================================================================
-- 3. Un locataire ne voit que ses propres réservations
-- =============================================================================

set role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :paye)::text, false);
select t('REFUS  locataire ne voit pas les reservations d''un autre',
         (select count(*) from bookings) = 1);
reset role;

-- =============================================================================
-- 4. Écritures interdites
-- =============================================================================

-- 4a. Réserver au nom d'un autre.
do $$
begin
  set local role authenticated;
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000c2"}', true);
  begin
    insert into bookings (tenant_id, listing_id, check_in, check_out,
                          nights, total_amount, deposit_amount)
    values ('00000000-0000-0000-0000-0000000000c1',
            '00000000-0000-0000-0000-0000000000e1',
            date '2026-11-01', date '2026-11-03', 2, 40000, 12000);
    perform t('REFUS  reserver au nom d''un autre locataire', false);
  exception when others then
    perform t('REFUS  reserver au nom d''un autre locataire', true);
  end;
end $$;

-- 4b. Réserver sur une annonce inactive.
do $$
begin
  set local role authenticated;
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000c2"}', true);
  begin
    insert into bookings (tenant_id, listing_id, check_in, check_out,
                          nights, total_amount, deposit_amount)
    values ('00000000-0000-0000-0000-0000000000c2',
            '00000000-0000-0000-0000-0000000000e2',
            date '2026-11-01', date '2026-11-03', 2, 33000, 10000);
    perform t('REFUS  reserver une annonce inactive', false);
  exception when others then
    perform t('REFUS  reserver une annonce inactive', true);
  end;
end $$;

-- 4c. LE CAS LE PLUS DANGEREUX : un locataire qui confirmerait son propre
-- paiement obtiendrait les coordonnees de l'hote sans jamais payer.
do $$
declare pid uuid;
begin
  insert into payments (booking_id, amount, method, external_ref)
  values ('00000000-0000-0000-0000-0000000000f2', 18000, 'MTN_MOMO', 'REF-TEST-001')
  returning id into pid;

  set local role authenticated;
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000c2"}', true);
  begin
    update payments set status = 'CONFIRMED', reviewed_at = now() where id = pid;
    if found then
      perform t('REFUS  locataire ne peut PAS confirmer son propre paiement', false);
    else
      perform t('REFUS  locataire ne peut PAS confirmer son propre paiement', true);
    end if;
  exception when others then
    perform t('REFUS  locataire ne peut PAS confirmer son propre paiement', true);
  end;
end $$;

-- 4d. Créer une annonce sans être administrateur (ADR-008).
do $$
begin
  set local role authenticated;
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000b1"}', true);
  begin
    insert into listings (owner_id, neighborhood_id, title, price_per_night, listing_type)
    values ('00000000-0000-0000-0000-0000000000b1',
            '00000000-0000-0000-0000-0000000000d1',
            'Annonce pirate', 5000, 'ROOM');
    perform t('REFUS  proprietaire ne peut pas creer une annonce (MVP)', false);
  exception when others then
    perform t('REFUS  proprietaire ne peut pas creer une annonce (MVP)', true);
  end;
end $$;

-- =============================================================================
-- 5. LA garantie anti-double-reservation
--
-- C'est la reponse a la lacune CDC-02. Si ce test passe a tort, deux
-- locataires peuvent reserver les memes dates.
-- =============================================================================

-- 5a. Chevauchement direct avec un blocage existant.
do $$
begin
  begin
    insert into listing_blocks (listing_id, period)
    values ('00000000-0000-0000-0000-0000000000e1',
            daterange(date '2026-09-12', date '2026-09-15', '[)'));
    perform t('REFUS  periode qui chevauche une reservation confirmee', false);
  exception when exclusion_violation then
    perform t('REFUS  periode qui chevauche une reservation confirmee', true);
  end;
end $$;

-- 5b. Chevauchement englobant.
do $$
begin
  begin
    insert into listing_blocks (listing_id, period)
    values ('00000000-0000-0000-0000-0000000000e1',
            daterange(date '2026-09-01', date '2026-09-30', '[)'));
    perform t('REFUS  periode englobante', false);
  exception when exclusion_violation then
    perform t('REFUS  periode englobante', true);
  end;
end $$;

-- 5c. Temoin : intervalle SEMI-OUVERT. Un depart le 13 et une arrivee le 13
-- ne se chevauchent pas — comportement attendu d'un hotel.
do $$
begin
  begin
    insert into listing_blocks (listing_id, period)
    values ('00000000-0000-0000-0000-0000000000e1',
            daterange(date '2026-09-13', date '2026-09-16', '[)'));
    perform t('AUTORISE arrivee le jour du depart precedent', true);
  exception when others then
    perform t('AUTORISE arrivee le jour du depart precedent', false);
  end;
end $$;

-- 5d. Temoin : un autre logement aux memes dates est libre.
do $$
begin
  begin
    insert into listing_blocks (listing_id, period)
    values ('00000000-0000-0000-0000-0000000000e2',
            daterange(date '2026-09-10', date '2026-09-13', '[)'));
    perform t('AUTORISE memes dates sur un AUTRE logement', true);
  exception when others then
    perform t('AUTORISE memes dates sur un AUTRE logement', false);
  end;
end $$;

-- =============================================================================
-- Verdict
-- =============================================================================
reset role;

select label, case when ok then 'OK' else 'ECHEC' end as resultat
from test_results order by seq;

do $$
declare n_ko int; n_tot int;
begin
  select count(*) filter (where not ok), count(*) into n_ko, n_tot from test_results;
  raise notice '--- % tests, % echec(s) ---', n_tot, n_ko;
  if n_ko > 0 then
    raise exception '% test(s) de securite en echec', n_ko;
  end if;
end $$;
