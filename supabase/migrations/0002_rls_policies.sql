-- =============================================================================
-- 0002 — Politiques RLS
--
-- Principe directeur (ADR-004) : les règles d'autorisation vivent dans la base,
-- pas dans le code. Une route oubliée ne doit pas pouvoir contourner une règle.
--
-- Deux règles métier sont ici, et nulle part ailleurs :
--   · un propriétaire ne voit que ses propres logements          (CDC §9)
--   · adresse et téléphone masqués jusqu'au paiement de l'avance (ADR-007)
--
-- RAPPEL ADR-004 : toute politique doit être accompagnée d'un test qui vérifie
-- le REFUS, pas seulement l'autorisation. Voir supabase/tests/.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Fonctions d'aide
--
-- `security definer` est indispensable : une politique sur `profiles` qui
-- interrogerait `profiles` déclencherait une récursion infinie de RLS.
-- `search_path` est figé pour éviter le détournement par un schéma tiers.
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'ADMIN'
  );
$$;

create or replace function public.owns_listing(target_listing uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from listings
    where id = target_listing and owner_id = auth.uid()
  );
$$;

-- Le locataire a-t-il DROIT aux coordonnées de ce logement ?
-- Uniquement si son avance a été vérifiée. C'est le pivot du modèle
-- économique : sans cette condition, la plateforme est un annuaire gratuit.
create or replace function public.has_confirmed_booking(target_listing uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from bookings
    where listing_id = target_listing
      and tenant_id = auth.uid()
      and status in ('CONFIRMED', 'COMPLETED')
  );
$$;

-- -----------------------------------------------------------------------------
-- Activation de RLS sur TOUTES les tables.
-- Une table oubliée ici est une table entièrement ouverte.
-- -----------------------------------------------------------------------------
alter table neighborhoods    enable row level security;
alter table profiles         enable row level security;
alter table listings         enable row level security;
alter table listing_contacts enable row level security;
alter table listing_images   enable row level security;
alter table bookings         enable row level security;
alter table listing_blocks   enable row level security;
alter table payments         enable row level security;
alter table chat_sessions    enable row level security;
alter table chat_messages    enable row level security;

-- -----------------------------------------------------------------------------
-- neighborhoods — référentiel public
-- -----------------------------------------------------------------------------
create policy neighborhoods_read_all on neighborhoods
  for select using (is_active or is_admin());

create policy neighborhoods_admin_write on neighborhoods
  for all using (is_admin()) with check (is_admin());

-- -----------------------------------------------------------------------------
-- profiles — strictement privé
--
-- Aucune lecture publique, même du nom. Le MVP n'affiche pas l'identité de
-- l'hôte avant paiement ; l'ouvrir « au cas où » exposerait des numéros de
-- téléphone déclarés.
-- -----------------------------------------------------------------------------
create policy profiles_read_own on profiles
  for select using (id = auth.uid() or is_admin());

create policy profiles_update_own on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy profiles_admin_all on profiles
  for all using (is_admin()) with check (is_admin());

-- -----------------------------------------------------------------------------
-- listings
--
-- Lecture publique des seules annonces actives — y compris pour un visiteur
-- non connecté, l'agent IA devant fonctionner sans compte (PRD US-001).
-- Écriture réservée aux administrateurs : au MVP, les annonces sont saisies
-- par l'équipe (ADR-008).
-- -----------------------------------------------------------------------------
create policy listings_read_public on listings
  for select using (
    is_active
    or owner_id = auth.uid()
    or is_admin()
  );

create policy listings_admin_write on listings
  for all using (is_admin()) with check (is_admin());

-- -----------------------------------------------------------------------------
-- listing_contacts — LA règle anti-désintermédiation
--
-- Lisible seulement par : le propriétaire, un administrateur, ou un locataire
-- dont l'avance a été VÉRIFIÉE sur ce logement.
-- Un locataire dont la réservation est seulement ACCEPTED ou DEPOSIT_DECLARED
-- n'y a PAS accès — c'est le point exact où le modèle se joue.
-- -----------------------------------------------------------------------------
create policy listing_contacts_read_gated on listing_contacts
  for select using (
    owns_listing(listing_id)
    or has_confirmed_booking(listing_id)
    or is_admin()
  );

create policy listing_contacts_admin_write on listing_contacts
  for all using (is_admin()) with check (is_admin());

-- -----------------------------------------------------------------------------
-- listing_images — visibles si l'annonce l'est
-- -----------------------------------------------------------------------------
create policy listing_images_read on listing_images
  for select using (
    exists (
      select 1 from listings l
      where l.id = listing_id
        and (l.is_active or l.owner_id = auth.uid() or is_admin())
    )
  );

create policy listing_images_admin_write on listing_images
  for all using (is_admin()) with check (is_admin());

-- -----------------------------------------------------------------------------
-- bookings
-- -----------------------------------------------------------------------------
create policy bookings_read_involved on bookings
  for select using (
    tenant_id = auth.uid()
    or owns_listing(listing_id)
    or is_admin()
  );

-- Un locataire ne peut créer une demande qu'en son propre nom, et uniquement
-- sur une annonce active.
create policy bookings_insert_own on bookings
  for insert with check (
    tenant_id = auth.uid()
    and exists (select 1 from listings l where l.id = listing_id and l.is_active)
  );

-- Le propriétaire répond aux demandes sur SES logements (CDC §9), le locataire
-- peut agir sur les siennes, l'administrateur sur tout.
create policy bookings_update_involved on bookings
  for update using (
    tenant_id = auth.uid()
    or owns_listing(listing_id)
    or is_admin()
  ) with check (
    tenant_id = auth.uid()
    or owns_listing(listing_id)
    or is_admin()
  );

-- -----------------------------------------------------------------------------
-- listing_blocks — lecture publique
--
-- Les dates indisponibles doivent être visibles sans compte : c'est ce qui
-- permet à l'agent de ne proposer que des logements réellement libres
-- (PRD US-001). Aucune donnée personnelle n'y figure.
-- -----------------------------------------------------------------------------
create policy listing_blocks_read_public on listing_blocks
  for select using (true);

create policy listing_blocks_owner_write on listing_blocks
  for all using (owns_listing(listing_id) or is_admin())
  with check (owns_listing(listing_id) or is_admin());

-- -----------------------------------------------------------------------------
-- payments
--
-- Le locataire déclare sa référence ; seul un administrateur peut changer le
-- statut. Un locataire qui pourrait passer son propre paiement à CONFIRMED
-- obtiendrait les coordonnées de l'hôte sans payer.
-- -----------------------------------------------------------------------------
create policy payments_read_involved on payments
  for select using (
    exists (select 1 from bookings b where b.id = booking_id and b.tenant_id = auth.uid())
    or is_admin()
  );

create policy payments_insert_own on payments
  for insert with check (
    status = 'DECLARED'
    and exists (
      select 1 from bookings b
      where b.id = booking_id
        and b.tenant_id = auth.uid()
        and b.status = 'ACCEPTED'
    )
  );

create policy payments_admin_update on payments
  for update using (is_admin()) with check (is_admin());

-- -----------------------------------------------------------------------------
-- chat_sessions / chat_messages — fermées aux clients
--
-- L'agent IA est servi par une route serveur Next.js qui détient la clé du
-- modèle et opère avec le rôle de service, lequel contourne RLS. Aucun client
-- n'écrit dans ces tables directement.
--
-- Ce choix découle aussi de la mesure de latence : ~250 ms par aller-retour
-- vers la base depuis le Cameroun. Le serveur, colocalisé avec la base,
-- enchaîne ses requêtes à coût quasi nul (ADR-004).
-- -----------------------------------------------------------------------------
create policy chat_sessions_read_own on chat_sessions
  for select using (user_id = auth.uid() or is_admin());

create policy chat_messages_read_own on chat_messages
  for select using (
    exists (
      select 1 from chat_sessions s
      where s.id = session_id and (s.user_id = auth.uid() or is_admin())
    )
  );
