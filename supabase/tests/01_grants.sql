-- =============================================================================
-- Privilèges de table — reproduit ce que Supabase applique par défaut.
--
-- Distinction essentielle, et souvent confondue :
--   · GRANT décide si un rôle peut TOUCHER la table.
--   · RLS décide QUELLES LIGNES il voit une fois qu'il y a accès.
-- Sans GRANT, tout est refusé et les tests RLS passeraient pour de mauvaises
-- raisons — on croirait tester une politique alors qu'on teste une permission.
-- =============================================================================

grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;
