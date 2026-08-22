-- =============================================================================
-- 0007 — Marquage des données de démonstration
--
-- POURQUOI UNE COLONNE PLUTÔT QU'UNE CONVENTION DE NOMMAGE
--
-- Le fondateur a besoin de volume pour développer et pour mesurer l'agent : à
-- une seule annonce, tout marche par accident. Mais des annonces inventées
-- ressemblent à des vraies, surtout une fois des photos ajoutées — et les
-- règles de travail sont explicites : « ne jamais laisser de données de
-- démonstration se faire passer pour des données réelles. Elles survivent
-- toujours plus longtemps que prévu. »
--
-- Un préfixe dans le titre serait retiré par la première personne qui trouve
-- ça moche. Une colonne, non : elle est interrogeable, elle permet à
-- l'interface d'AVERTIR, et elle rend la purge exacte — `delete from listings
-- where is_demo`, sans risque d'emporter une vraie annonce.
--
-- Elle sert aussi de garde-fou : la production pourra refuser d'afficher des
-- lignes marquées, ce qu'aucune convention de nommage ne permet.
-- =============================================================================

alter table listings
  add column if not exists is_demo boolean not null default false;

comment on column listings.is_demo is
  'Annonce inventée pour le développement et la mesure. Ne JAMAIS publier en production. Purge : delete from listings where is_demo;';

-- Index partiel : on interroge presque toujours « les vraies », donc l'index
-- ne porte que sur le petit ensemble des fausses.
create index if not exists listings_demo_idx on listings (id) where is_demo;

-- Idem pour les comptes propriétaires créés pour la démonstration : sans cela,
-- la purge des annonces laisserait des profils orphelins qu'on prendrait pour
-- de vrais bailleurs.
alter table profiles
  add column if not exists is_demo boolean not null default false;

comment on column profiles.is_demo is
  'Profil inventé pour le développement. Purge : voir supabase/purge-demo.sh';
