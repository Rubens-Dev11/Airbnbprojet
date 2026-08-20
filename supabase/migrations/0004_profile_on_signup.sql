-- =============================================================================
-- 0004 — Création automatique du profil à l'inscription
--
-- Manque constaté le 7 août 2026 en préparant le premier essai réel : rien ne
-- reliait `auth.users` à `profiles`. Un utilisateur s'inscrivait, sa ligne
-- d'authentification existait, son profil non — et toute lecture de rôle
-- retournait vide. Le défaut n'était visible ni au typecheck, ni au build, ni
-- dans les tests RLS, qui insèrent leurs profils à la main.
--
-- Le rôle par défaut est TENANT. Un propriétaire est promu par un
-- administrateur (CDC §4 : « valider les comptes propriétaires »), jamais par
-- auto-déclaration : sinon n'importe qui se donne le rôle qu'il veut.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    -- Le nom peut venir des métadonnées d'inscription ; sinon, repli sur la
    -- partie locale de l'email. Jamais NULL : `full_name` est obligatoire, et
    -- une insertion en échec ici ferait échouer l'inscription entière.
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(new.email, 'utilisateur'), '@', 1)
    ),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    'TENANT'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
