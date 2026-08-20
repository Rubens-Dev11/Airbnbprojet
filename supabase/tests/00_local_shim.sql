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

-- Les colonnes reproduites sont celles dont le code dépend réellement.
-- `raw_user_meta_data` a été ajoutée le 7 août 2026 après que la migration
-- 0004 a échoué ici alors qu'elle passait sur le vrai Supabase : une doublure
-- trop pauvre ne fait pas gagner du temps, elle fait perdre confiance dans le
-- test. Toute colonne utilisée par une migration doit exister ici.
create table if not exists auth.users (
  id                 uuid primary key default gen_random_uuid(),
  email              text unique,
  raw_user_meta_data jsonb not null default '{}'::jsonb
);

-- Rattrapage si la table existait déjà sans la colonne.
alter table auth.users
  add column if not exists raw_user_meta_data jsonb not null default '{}'::jsonb;

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

-- -----------------------------------------------------------------------------
-- Schéma `storage`, minimal.
--
-- Reproduit uniquement ce que les migrations touchent : les compartiments et
-- la table sur laquelle portent les politiques. Cela vérifie que le SQL de
-- 0006 est VALIDE et que ses politiques s'appliquent — pas que le service de
-- stockage se comporte comme en production. La différence est réelle et doit
-- rester présente à l'esprit.
-- -----------------------------------------------------------------------------
create schema if not exists storage;

create table if not exists storage.buckets (
  id                 text primary key,
  name               text not null,
  public             boolean not null default false,
  file_size_limit    bigint,
  allowed_mime_types text[]
);

create table if not exists storage.objects (
  id        uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name      text,
  owner     uuid
);

alter table storage.objects enable row level security;

grant usage on schema storage to anon, authenticated, service_role;
