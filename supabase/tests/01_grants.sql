-- =============================================================================
-- CE FICHIER NE FAIT PLUS RIEN. Il est conservé comme avertissement.
--
-- Il accordait autrefois les privilèges de table aux rôles applicatifs. C'était
-- une faute de conception : un fichier de TEST accordait des droits que la
-- vraie base n'avait pas. Les 20 tests RLS passaient au vert en validant un
-- monde qui n'existait qu'à l'intérieur du harnais.
--
-- Le défaut n'a été découvert qu'en affichant une page réelle contre le vrai
-- Supabase — « permission denied for table listings ». Ni le typecheck, ni le
-- build, ni la suite de tests ne pouvaient le voir.
--
-- Les GRANT sont désormais dans `supabase/migrations/0005_grants.sql`, donc
-- appliqués en production comme en test. Le harnais exerce maintenant les
-- MÊMES droits que le produit.
--
-- Règle : un fichier de test ne doit jamais accorder un droit, créer une table
-- ni activer une extension dont la production a besoin. Sinon il teste sa
-- propre configuration.
-- =============================================================================

do $$
begin
  -- Contrôle actif : si les privilèges venaient à disparaître des migrations,
  -- on le saurait ici plutôt qu'en production.
  if not exists (
    select 1
    from information_schema.role_table_grants
    where grantee = 'anon'
      and table_schema = 'public'
      and table_name = 'listings'
      and privilege_type = 'SELECT'
  ) then
    raise exception
      'le role anon n''a pas SELECT sur listings — la migration 0005_grants.sql manque ou a ete modifiee';
  end if;
end $$;
