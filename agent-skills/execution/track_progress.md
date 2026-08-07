# Skill Name

track_progress

# Description

Suit l'avancement de toutes les tâches en temps réel, détecte les dérives (retards, blocages, scope creep) et produit un rapport de statut synthétique pour le CEO Agent.

# Capabilities

- Maintenir l'état de chaque tâche : todo / in_progress / review / done / blocked
- Vérifier les Definition of Done avant de marquer "done"
- Détecter les tâches bloquées ou en retard vs estimation
- Calculer la vélocité et projeter la date de fin du lot
- Alerter le CEO Agent sur les risques planning

# Inputs

- `execution/assignments.md`
- Comptes-rendus des Dev Agents (PR, commits, rapports)
- Historique de vélocité (depuis `memory/recall_context`)

# Outputs

- `execution/status_report.md` contenant :
  - Tableau de bord : tâches par statut, % du lot complété
  - Tâches à risque (bloquées > 1 cycle, dépassement d'estimation)
  - Vélocité et projection de fin de lot
  - Actions recommandées au CEO Agent

# Instructions

1. À chaque cycle, collecter l'état de toutes les tâches assignées.
2. Pour chaque tâche "done" déclarée : vérifier la DoD (PR mergée ? critères remplis ?). Refuser sinon.
3. Marquer "blocked" toute tâche sans progression depuis 1 cycle et identifier la cause.
4. Comparer temps réel vs estimation ; signaler tout dépassement > 50%.
5. Recalculer la projection de fin de lot et comparer à la roadmap.
6. Escalader vers `unblock_issues` chaque blocage, et vers le CEO Agent tout risque de dérive du lot.
7. Archiver les métriques du cycle via `memory/store_decisions`.

# Example Usage

> Input : Lot 1, cycle 3 — 8 tâches assignées.
>
> Output : 5 done, 1 in_progress, 2 blocked. T-014 bloquée (attend variable d'environnement DB). Vélocité : 2,5 tâches/cycle → fin de lot projetée cycle 5 (vs 4 prévu). Action : escalader T-014 à `unblock_issues`, prévenir le CEO Agent du glissement d'un cycle.
