# Skill Name

improve_strategy

# Description

Boucle d'amélioration continue : à chaque fin de lot ou de milestone, analyse les écarts entre plan et réalité, en tire des leçons et propose des ajustements de stratégie, de roadmap ou de processus.

# Capabilities

- Comparer prévisions vs réalisé (vélocité, scope, qualité)
- Analyser les blocages récurrents et leurs causes racines
- Confronter les métriques produit aux hypothèses business
- Proposer des ajustements concrets : roadmap, processus, assignations
- Mettre à jour les hypothèses validées/invalidées

# Inputs

- `execution/status_report.md` (historique du lot)
- `execution/resolutions.md` (blocages du lot)
- Métriques produit réelles si disponibles (réservations, inscriptions)
- `strategy/roadmap.md` et hypothèses du `business_model.md`

# Outputs

- `memory/retrospectives/retro-lot-X.md` contenant :
  - Écarts plan vs réalisé avec causes
  - Hypothèses business : validées / invalidées / en cours
  - 3 leçons apprises maximum (actionnables)
  - Ajustements proposés (roadmap, processus, estimation)
- Propositions de mise à jour de `strategy/roadmap.md` soumises au CEO Agent

# Instructions

1. À chaque fin de lot, collecter : tâches prévues vs livrées, blocages, dépassements d'estimation.
2. Identifier les 3 causes principales d'écart (pas plus — rester actionnable).
3. Confronter les métriques produit aux hypothèses du business model : marquer chaque hypothèse validée/invalidée avec preuve.
4. Si une hypothèse clé est invalidée : proposer un ajustement de roadmap (voire un pivot) au CEO Agent — jamais de pivot silencieux.
5. Proposer des améliorations de processus (ex: revoir la granularité du découpage si les estimations dérivent).
6. Consigner via `store_decisions` tout changement accepté, puis relancer le cycle sur `generate_product_roadmap` si la roadmap change.

# Example Usage

> Input : fin du Lot 1 — 8 tâches prévues, 6 livrées, 2 blocages environnement.
>
> Output : Leçon 1 : valider l'environnement (DB, env vars) avant chaque lot → checklist ajoutée. Leçon 2 : les tâches UI sont sous-estimées de 40% → coefficient ajusté. Hypothèse "les hôtes publieront eux-mêmes leurs logements" : non testable encore — prévoir un onboarding manuel des 10 premiers hôtes au Lot 2. Roadmap : inchangée.
