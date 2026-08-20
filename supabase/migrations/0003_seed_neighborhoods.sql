-- =============================================================================
-- 0003 — Référentiel des quartiers de Douala
--
-- Données de référence, pas des données d'essai : l'application en dépend en
-- production. D'où une migration plutôt qu'un fichier de seed.
--
-- Idempotente (`on conflict do nothing`) : rejouable sans dommage.
--
-- ⚠ À FAIRE VALIDER PAR QUELQU'UN SUR PLACE.
-- Quatre quartiers seulement sont attestés par une source du dépôt :
--   · Akwa, Bonanjo, Deido, Bonapriso — cités au CDC §5.1
--   · Bepanda et Carrefour Andem — lus sur les captures PUOL du 17 juillet
-- Les autres proviennent de ma connaissance générale de Douala. Ils sont
-- plausibles, ils ne sont pas vérifiés. Un quartier manquant se corrige en une
-- ligne ; un quartier faux proposé à un utilisateur détruit la confiance dans
-- l'agent. En cas de doute : supprimer, pas garder.
--
-- Le champ `aliases` sert à l'agent IA : il doit rattacher « akwa nord »,
-- « vers Akwa » ou « akwa » à la même entrée. Sur du texte libre, la recherche
-- conversationnelle se dégrade vite — et c'est le canal principal (ADR-005).
-- =============================================================================

insert into neighborhoods (name, aliases) values
  -- --- Attestés par une source du dépôt ------------------------------------
  ('Akwa',        '{akwa, "akwa nord", "akwa sud", "centre ville"}'),
  ('Bonanjo',     '{bonanjo, bonandjo, "centre administratif"}'),
  ('Bonapriso',   '{bonapriso, bonaprisso}'),
  ('Deido',       '{deido, deïdo, dido}'),
  ('Bepanda',     '{bepanda, bépanda, "bepanda tapis rouge", "tapis rouge", "bepanda omnisport"}'),

  -- --- Connaissance générale — À VALIDER SUR PLACE --------------------------
  ('Bali',            '{bali}'),
  ('New Bell',        '{"new bell", newbell, "nouvelle ville"}'),
  ('Makepe',          '{makepe, maképé, "makepe missoke", "makepe rond point"}'),
  ('Bonamoussadi',    '{bonamoussadi, bonamousadi, "bonamoussadi carrefour"}'),
  ('Logbessou',       '{logbessou, logbesou}'),
  ('Logpom',          '{logpom, "logpom barrière", "logpom barriere"}'),
  ('Kotto',           '{kotto}'),
  ('Ndogbong',        '{ndogbong, ndokbong}'),
  ('Ndogpassi',       '{ndogpassi, ndokpassi}'),
  ('Nyalla',          '{nyalla, nyala}'),
  ('Bonaberi',        '{bonaberi, bonabéri, bonassama}'),
  ('Ange Raphaël',    '{"ange raphael", "ange raphaël", "ange rafael"}'),
  ('Cité des Palmiers', '{"cite des palmiers", "cité des palmiers", "cite palmier"}'),
  ('Yassa',           '{yassa}'),
  ('Japoma',          '{japoma}'),
  ('PK',              '{pk, pk8, pk10, pk12, pk14, "pk 8", "pk 10"}'),
  ('Village',         '{village, "village bonaberi"}'),
  ('Bonadibong',      '{bonadibong}'),
  ('Carrefour Andem', '{"carrefour andem", andem, "carrefour adem"}')
on conflict (name) do nothing;

-- Contrôle immédiat : une insertion silencieusement vide serait invisible
-- jusqu'au premier écran de recherche.
do $$
declare n int;
begin
  select count(*) into n from neighborhoods;
  raise notice 'quartiers en base : %', n;
  if n < 5 then
    raise exception 'referentiel des quartiers quasi vide (% lignes) — la recherche par quartier ne peut pas fonctionner', n;
  end if;
end $$;
