-- =============================================================================
-- 0001 — Schéma initial
--
-- Référence : docs/documentation/PRD.md §6
-- Conventions : docs/tech/stack.md §4
--   · identifiants en anglais (écart au CDC §7 assumé et consigné)
--   · montants en ENTIERS de FCFA — le franc CFA n'a pas de décimales,
--     un flottant y serait une erreur, pas une approximation
-- =============================================================================

-- btree_gist est requis par la contrainte d'exclusion sur les dates.
-- Sans cette extension, la garantie anti-double-réservation n'existe pas :
-- deux réservations simultanées sur les mêmes dates passeraient toutes deux.
create extension if not exists btree_gist;

-- =============================================================================
-- Énumérations
-- =============================================================================

-- VISITEUR n'est délibérément PAS une valeur : un visiteur non connecté n'a
-- aucune ligne dans profiles. Corrige la contradiction CDC-01 relevée dans
-- docs/etat-des-lieux.md §6.
create type user_role as enum ('TENANT', 'OWNER', 'ADMIN');

create type listing_type as enum ('ROOM', 'STUDIO', 'APARTMENT', 'VILLA');

-- Correspondance avec les états décrits au PRD §6 :
--   PENDING          = EN_ATTENTE
--   ACCEPTED         = ACCEPTEE            (l'hôte a accepté, avance non payée)
--   DEPOSIT_DECLARED = AVANCE_DECLAREE     (le locataire a saisi sa référence)
--   CONFIRMED        = CONFIRMEE           (avance vérifiée — BLOQUE les dates)
--   COMPLETED        = TERMINEE            (séjour passé — BLOQUE les dates)
--   REJECTED         = REFUSEE
--   EXPIRED          = EXPIREE             (24 h sans réponse de l'hôte)
--   CANCELLED        = ANNULEE
create type booking_status as enum (
  'PENDING', 'ACCEPTED', 'DEPOSIT_DECLARED',
  'CONFIRMED', 'COMPLETED',
  'REJECTED', 'EXPIRED', 'CANCELLED'
);

create type payment_status as enum ('DECLARED', 'CONFIRMED', 'REJECTED');

-- =============================================================================
-- Quartiers de Douala
--
-- Table de référence plutôt que texte libre : l'agent IA doit pouvoir faire
-- correspondre « akwa », « Akwa nord », « vers Akwa » à une entrée unique.
-- Sur du texte libre, la recherche conversationnelle se dégrade vite.
-- =============================================================================
create table neighborhoods (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  -- Variantes d'écriture et appellations locales, pour la reconnaissance par
  -- l'agent. Ex. pour Bonanjo : {'bonanjo','bonandjo','centre administratif'}
  aliases     text[] not null default '{}',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index neighborhoods_aliases_idx on neighborhoods using gin (aliases);

-- =============================================================================
-- Profils
--
-- Prolonge auth.users, géré par Supabase Auth. On ne duplique ni l'email ni
-- le mot de passe : ils vivent dans auth.users et nulle part ailleurs.
-- =============================================================================
create table profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  role         user_role not null default 'TENANT',
  full_name    text not null,
  -- Déclaratif au MVP : l'OTP par SMS est reporté (PRD §4.3, ADR-008).
  -- Ne PAS traiter ce numéro comme vérifié.
  phone        text,
  avatar_path  text,
  -- Un propriétaire doit être validé par un administrateur avant que ses
  -- logements soient visibles (CDC §4).
  is_approved  boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index profiles_role_idx on profiles (role);

-- =============================================================================
-- Logements
-- =============================================================================
create table listings (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references profiles (id) on delete restrict,
  neighborhood_id uuid not null references neighborhoods (id) on delete restrict,

  title           text not null,
  description     text not null default '',
  -- Repère public approximatif : « près du carrefour Andem ». Pas l'adresse
  -- exacte — celle-ci vit dans listing_contacts, voir plus bas.
  landmark        text,

  -- ENTIER, en FCFA. Voir l'en-tête de ce fichier.
  price_per_night integer not null check (price_per_night > 0),
  listing_type    listing_type not null,
  max_guests      smallint not null default 2 check (max_guests > 0),

  -- Équipements normalisés : 'WIFI', 'AC', 'PARKING', 'KITCHEN', 'WATER_HEATER'…
  amenities       text[] not null default '{}',

  is_active       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Index de recherche. Le filtre par prix et par quartier est le plus fréquent
-- du parcours critique (PRD §4.1).
create index listings_neighborhood_idx on listings (neighborhood_id) where is_active;
create index listings_price_idx        on listings (price_per_night) where is_active;
create index listings_owner_idx        on listings (owner_id);
create index listings_amenities_idx    on listings using gin (amenities);

-- =============================================================================
-- Coordonnées exactes — table séparée, et c'est délibéré
--
-- La mécanique anti-désintermédiation d'ADR-007 exige que l'adresse précise et
-- le téléphone de l'hôte restent masqués jusqu'au paiement de l'avance. Sans
-- elle, la plateforme est un annuaire gratuit et n'encaisse rien.
--
-- RLS filtre des LIGNES, pas des colonnes. Laisser ces champs dans `listings`
-- aurait donc renvoyé la règle dans le code applicatif — qu'une seule route
-- oubliée suffit à contourner. En table séparée, la règle devient une
-- politique appliquée par PostgreSQL : c'est tout l'argument d'ADR-004.
-- =============================================================================
create table listing_contacts (
  listing_id     uuid primary key references listings (id) on delete cascade,
  exact_address  text not null,
  contact_phone  text not null,
  access_notes   text,
  updated_at     timestamptz not null default now()
);

-- =============================================================================
-- Photos
--
-- Table dédiée plutôt qu'un tableau JSON : l'ordre d'affichage doit être
-- modifiable, et une photo doit pouvoir être supprimée seule.
-- `storage_path` pointe vers Supabase Storage, jamais une URL en dur.
-- =============================================================================
create table listing_images (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references listings (id) on delete cascade,
  storage_path text not null,
  position     smallint not null default 0,
  created_at   timestamptz not null default now()
);

create index listing_images_listing_idx on listing_images (listing_id, position);

-- =============================================================================
-- Réservations
-- =============================================================================
create table bookings (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references profiles (id) on delete restrict,
  listing_id  uuid not null references listings (id) on delete restrict,

  -- Intervalle semi-ouvert [arrivée, départ) : un départ le 15 et une arrivée
  -- le 15 ne se chevauchent pas. C'est le comportement attendu d'un hôtel.
  check_in    date not null,
  check_out   date not null,

  -- Montants figés à la création : le prix du logement peut changer ensuite,
  -- la réservation ne doit pas bouger.
  nights          smallint not null check (nights > 0),
  total_amount    integer  not null check (total_amount > 0),
  deposit_amount  integer  not null check (deposit_amount > 0),

  status      booking_status not null default 'PENDING',
  message     text,

  -- Échéance des 24 h imposées au PRD (US-010). Passé ce délai sans réponse
  -- de l'hôte, la demande expire.
  expires_at  timestamptz not null default now() + interval '24 hours',

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint bookings_dates_ordered check (check_out > check_in),
  constraint bookings_deposit_within_total check (deposit_amount <= total_amount)
);

create index bookings_tenant_idx  on bookings (tenant_id, created_at desc);
create index bookings_listing_idx on bookings (listing_id);
create index bookings_pending_idx on bookings (expires_at) where status = 'PENDING';

-- =============================================================================
-- Indisponibilités — LA garantie anti-double-réservation
--
-- Toutes les périodes bloquées passent par cette table : blocage manuel du
-- propriétaire ET réservation confirmée. Une seule contrainte les couvre donc
-- toutes les deux.
--
-- Pourquoi ici et pas sur `bookings` : une contrainte posée sur `bookings`
-- n'empêcherait pas un blocage manuel de recouvrir une réservation confirmée.
-- Centraliser les périodes est le seul moyen d'avoir UNE garantie plutôt que
-- deux règles à tenir cohérentes à la main.
--
-- Répond à la lacune CDC-02 : `Property.disponible BOOLEAN` du CDC §7 ne
-- représente pas un calendrier.
-- =============================================================================
create table listing_blocks (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references listings (id) on delete cascade,
  period      daterange not null,
  -- NULL = blocage manuel du propriétaire ; sinon, la réservation à l'origine.
  booking_id  uuid unique references bookings (id) on delete cascade,
  reason      text,
  created_at  timestamptz not null default now(),

  -- Deux périodes ne peuvent pas se recouvrir sur un même logement.
  -- C'est la base qui tranche, pas l'application : en cas de deux
  -- confirmations simultanées, la seconde échoue. Aucune logique applicative
  -- ne peut offrir cette garantie de façon fiable.
  constraint listing_blocks_no_overlap
    exclude using gist (listing_id with =, period with &&)
);

create index listing_blocks_listing_idx on listing_blocks using gist (listing_id, period);

-- =============================================================================
-- Paiements
--
-- MVP : encaissement manuel (ADR-008). Le locataire déclare la référence de sa
-- transaction Mobile Money, un administrateur la confirme.
-- Aucun agrégateur, aucun webhook — intégrer un prestataire de paiement
-- contredit ADR-008.
-- =============================================================================
create table payments (
  id               uuid primary key default gen_random_uuid(),
  booking_id       uuid not null unique references bookings (id) on delete restrict,

  amount           integer not null check (amount > 0),
  -- 'MTN_MOMO' | 'ORANGE_MONEY' — texte plutôt qu'énumération : les moyens
  -- de paiement bougeront plus vite que le schéma.
  method           text not null,
  -- Référence saisie par le locataire, telle qu'affichée par son opérateur.
  external_ref     text not null,

  status           payment_status not null default 'DECLARED',
  -- Traçabilité : un statut ne change jamais sans qu'on sache qui l'a changé.
  reviewed_by      uuid references profiles (id) on delete set null,
  reviewed_at      timestamptz,
  review_note      text,

  created_at       timestamptz not null default now(),

  constraint payments_reviewed_consistently
    check ((status = 'DECLARED') = (reviewed_at is null))
);

create index payments_status_idx on payments (status, created_at);

-- =============================================================================
-- Conversations de l'agent IA
--
-- Une ligne PAR MESSAGE, et non un tableau JSON unique par session.
-- Motif : un JSONB qui grossit sans borne devient impossible à indexer, à
-- paginer et à analyser — or la part de réservations initiées via l'agent est
-- l'indicateur qui valide ou invalide le produit (ADR-005, PRD §3.2 S1).
-- =============================================================================
create table chat_sessions (
  id          uuid primary key default gen_random_uuid(),
  -- NULL pour un visiteur non connecté : l'agent fonctionne sans compte
  -- (PRD US-001).
  user_id     uuid references profiles (id) on delete set null,
  -- Identifiant anonyme du navigateur ou de l'appareil, pour rattacher la
  -- session d'un visiteur à son compte s'il s'inscrit ensuite.
  client_key  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index chat_sessions_user_idx   on chat_sessions (user_id, updated_at desc);
create index chat_sessions_client_idx on chat_sessions (client_key);

create table chat_messages (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references chat_sessions (id) on delete cascade,
  role         text not null check (role in ('user', 'assistant', 'tool')),
  content      text not null,
  -- Appels d'outils et résultats, pour pouvoir relire une conversation et
  -- mesurer la pertinence des réponses (PRD §3.2 S3).
  tool_calls   jsonb,
  created_at   timestamptz not null default now()
);

create index chat_messages_session_idx on chat_messages (session_id, created_at);

-- Rattache une réservation à la session qui l'a produite. C'est ce qui permet
-- de mesurer S1 — la part de réservations initiées via l'agent. Sans ce lien,
-- l'indicateur qui décide de la suite du produit n'est pas mesurable.
alter table bookings
  add column origin_session_id uuid references chat_sessions (id) on delete set null;

create index bookings_origin_idx on bookings (origin_session_id);
