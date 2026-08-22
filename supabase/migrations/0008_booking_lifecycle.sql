-- =============================================================================
-- 0008 — Cycle de vie de la réservation
--
-- Trois règles du PRD n'existaient nulle part dans le code :
--   · une demande sans réponse EXPIRE au bout de 24 h (US-010)
--   · une réservation confirmée BLOQUE les dates (CDC §9)
--   · les dates se libèrent si la réservation est refusée ou annulée
--
-- Elles sont posées ici, en base, et non dans l'application. Motif : une règle
-- de cycle de vie oubliée dans une route ne se voit pas — elle se découvre le
-- jour où deux locataires ont la même chambre. Un déclencheur ne s'oublie pas.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Blocage automatique des dates
--
-- Le blocage naît de la CONFIRMATION, jamais de l'acceptation : c'est l'avance
-- vérifiée qui réserve, pas la parole de l'hôte (ADR-007). Une réservation
-- seulement acceptée ne bloque rien, et c'est voulu — sinon un locataire qui
-- ne paie jamais gèlerait le logement.
-- -----------------------------------------------------------------------------
create or replace function public.sync_booking_block()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('CONFIRMED', 'COMPLETED') then
    -- L'insertion peut ÉCHOUER sur la contrainte d'exclusion si les dates ont
    -- été prises entre-temps. C'est le comportement voulu : la confirmation
    -- est refusée plutôt que de créer une double réservation.
    insert into listing_blocks (listing_id, period, booking_id, reason)
    values (
      new.listing_id,
      daterange(new.check_in, new.check_out, '[)'),
      new.id,
      'reservation confirmee'
    )
    on conflict (booking_id) do nothing;

  elsif new.status in ('REJECTED', 'EXPIRED', 'CANCELLED') then
    -- Les dates redeviennent libres immédiatement. Les laisser bloquées
    -- coûterait des nuits vides à l'hôte sans que personne ne s'en aperçoive.
    delete from listing_blocks where booking_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_booking_status_change on bookings;

create trigger on_booking_status_change
  after insert or update of status on bookings
  for each row
  execute function public.sync_booking_block();

-- -----------------------------------------------------------------------------
-- Expiration des demandes sans réponse
--
-- Appelée à la lecture des demandes plutôt que par une tâche planifiée. Ce
-- n'est pas l'idéal — une demande n'expire que si quelqu'un regarde — mais
-- c'est HONNÊTE au stade actuel : aucun ordonnanceur n'est en place, et
-- prétendre qu'une expiration automatique fonctionne sans en avoir un serait
-- annoncer une garantie que le code n'applique pas.
--
-- À remplacer par une tâche planifiée avant l'ouverture publique.
-- -----------------------------------------------------------------------------
create or replace function public.expire_stale_bookings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update bookings
  set status = 'EXPIRED', updated_at = now()
  where status = 'PENDING'
    and expires_at < now();

  get diagnostics n = row_count;
  return n;
end;
$$;

grant execute on function public.expire_stale_bookings() to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Confirmation d'un paiement — opération atomique
--
-- Faire passer le paiement à CONFIRMED et la réservation à CONFIRMED sont deux
-- écritures qui doivent réussir ou échouer ensemble. Séparées côté
-- application, un incident entre les deux laisserait un paiement vérifié sur
-- une réservation qui ne l'est pas — donc un locataire qui a payé sans
-- obtenir les coordonnées.
-- -----------------------------------------------------------------------------
create or replace function public.confirm_payment(
  p_payment_id uuid,
  p_reviewer uuid,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking uuid;
begin
  if not exists (select 1 from profiles where id = p_reviewer and role = 'ADMIN') then
    raise exception 'Seul un administrateur peut confirmer un paiement';
  end if;

  select booking_id into v_booking
  from payments
  where id = p_payment_id and status = 'DECLARED'
  for update;

  if v_booking is null then
    raise exception 'Paiement introuvable ou deja traite';
  end if;

  update payments
  set status = 'CONFIRMED', reviewed_by = p_reviewer, reviewed_at = now(), review_note = p_note
  where id = p_payment_id;

  -- Le déclencheur ci-dessus crée le blocage. Si les dates ont été prises
  -- entre-temps, la contrainte d'exclusion fait échouer TOUTE la transaction :
  -- le paiement reste déclaré, et l'administrateur voit l'erreur.
  update bookings
  set status = 'CONFIRMED', updated_at = now()
  where id = v_booking;
end;
$$;

grant execute on function public.confirm_payment(uuid, uuid, text) to authenticated, service_role;
