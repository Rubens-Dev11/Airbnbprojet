-- =============================================================================
-- DOUBLURE LOCALE — n'est PAS une migration, ne part JAMAIS en production
--
-- Ce fichier reproduit le strict minimum que Supabase fournit d'office :
-- le schéma `auth`, la table `auth.users`, la fonction `auth.uid()` et les
-- rôles `anon` / `authenticated` / `service_role`.
--
-- Pourquoi il existe : la pile Supabase complète représente plusieurs images
-- Docker à télécharger. Sur la connexion de ce poste (~46 Kio/s mesurés), le
-- retour d'information se compterait en heures. Ici, les migrations et les
-- politiques RLS sont validées en minutes sur une image `postgres` déjà en
-- cache.
--
-- LIMITE, à ne pas oublier : ceci valide le SQL — schéma, contraintes,
-- politiques. Cela NE valide PAS l'intégration réelle avec Supabase Auth,
-- Storage ou Realtime. Une validation ici n'autorise pas à écrire
-- « ça marche sur Supabase ».
--
-- `auth.uid()` reproduit fidèlement l'implémentation de Supabase : elle lit la
-- revendication `sub` du JWT déposée dans `request.jwt.claims`. Les politiques
-- sont donc exercées avec exactement la même sémantique qu'en production.
-- =============================================================================

create schema if not exists auth;

create table if not exists auth.users (
  id    uuid primary key default gen_random_uuid(),
  email text unique
);

-- Le repli sur '{}' n'est pas cosmétique : sans lui, une requête anonyme —
-- où `request.jwt.claims` est vide — fait échouer le cast `''::json` et
-- toute politique appelant auth.uid() explose au lieu de refuser proprement.
-- Constaté à l'exécution le 7 août 2026.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(
    coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::json ->> 'sub',
    ''
  )::uuid;
$$;

-- Rôles applicatifs. Ils ne sont PAS superutilisateurs : c'est indispensable,
-- un superutilisateur contourne RLS et tous les tests passeraient à tort.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end
$$;

grant usage on schema public, auth to anon, authenticated, service_role;
