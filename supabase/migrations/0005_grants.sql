-- =============================================================================
-- 0005 — Privilèges de table
--
-- POURQUOI CE FICHIER EXISTE, ET POURQUOI C'EST UNE LEÇON
--
-- Ces GRANT vivaient dans `supabase/tests/01_grants.sql` — un fichier de TEST.
-- Conséquence : le harnais accordait des privilèges que la vraie base n'avait
-- pas. Les 20 tests RLS passaient au vert en validant un monde qui n'existait
-- qu'à l'intérieur du test.
--
-- Le défaut n'est apparu qu'en affichant une page réelle contre le vrai
-- Supabase : « permission denied for table listings ». Ni le typecheck, ni le
-- build, ni les tests ne pouvaient le voir — c'est précisément l'écart entre
-- un test et la réalité qu'aucun d'eux ne mesure.
--
-- Règle qui en découle : tout ce dont la production a besoin est une
-- MIGRATION. Un fichier de test ne doit jamais accorder un droit ; sinon il
-- teste sa propre configuration, pas celle du produit.
--
-- DISTINCTION, souvent confondue :
--   · GRANT décide si un rôle peut TOUCHER la table.
--   · RLS décide QUELLES LIGNES il voit une fois qu'il y a accès.
-- Les deux sont nécessaires. RLS sans GRANT refuse tout ; GRANT sans RLS
-- expose tout.
-- =============================================================================

grant usage on schema public to anon, authenticated, service_role;

-- Lecture pour tous : ce sont les politiques RLS de 0002 qui décident des
-- lignes réellement visibles. L'agent IA doit fonctionner sans compte
-- (PRD US-001), donc `anon` doit pouvoir lire.
grant select on all tables in schema public to anon, authenticated;

-- Écriture pour les comptes connectés uniquement, et là encore bornée par les
-- politiques : un locataire ne peut insérer qu'une réservation à son nom, un
-- propriétaire ne peut pas créer d'annonce (ADR-008).
grant insert, update, delete on all tables in schema public to authenticated;

grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

-- Les tables et fonctions créées PAR LA SUITE héritent des mêmes droits.
-- Sans cela, la prochaine migration qui ajoute une table reproduirait
-- exactement le bug ci-dessus — et il faudrait à nouveau une page en
-- production pour s'en apercevoir.
alter default privileges in schema public
  grant select on tables to anon, authenticated;
alter default privileges in schema public
  grant insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant execute on functions to anon, authenticated, service_role;
