# Skill Name

unblock_issues

# Description

Diagnostique et résout les blocages signalés par `track_progress` : blocages techniques, dépendances manquantes, ambiguïtés de spec ou conflits entre agents. Décide, contourne ou escalade.

# Capabilities

- Diagnostiquer la cause racine d'un blocage (technique, spec, dépendance, ressource)
- Proposer 2-3 options de déblocage avec trade-offs
- Décider ou faire trancher le CEO Agent selon la gravité
- Re-séquencer les tâches pour ne pas perdre de vélocité pendant le blocage
- Consigner la résolution pour éviter la récurrence

# Inputs

- Blocage signalé (tâche, agent, description)
- `execution/tasks.md` (graphe de dépendances)
- `memory/recall_context` (blocages similaires passés)

# Outputs

- `execution/resolutions.md` (append) contenant :
  - Blocage : tâche, cause racine, durée
  - Options envisagées avec trade-offs
  - Décision prise et justification
  - Action de prévention

# Instructions

1. Qualifier le blocage : technique (bug, dépendance), spec (ambiguïté), externe (accès, clé API), humain (décision requise).
2. Consulter la mémoire : ce blocage a-t-il déjà été résolu ?
3. Générer 2-3 options : résoudre, contourner (mock, feature flag), reporter (re-séquencer le lot).
4. Si la décision est réversible et locale → trancher immédiatement. Si elle impacte le scope, le budget ou l'architecture → escalader au CEO Agent avec recommandation.
5. Pendant le blocage, réassigner l'agent bloqué sur une tâche parallélisable.
6. Consigner la résolution et la règle de prévention via `memory/store_decisions`.

# Example Usage

> Input : T-014 bloquée — la variable DATABASE_URL n'est pas configurée, DB Agent à l'arrêt.
>
> Output : Cause : externe (intégration Neon non connectée). Options : (a) demander la connexion Neon au fondateur, (b) mocker la DB en attendant. Décision : (a) + réassigner le DB Agent sur T-017 (seed de données, parallélisable). Prévention : checklist d'environnement validée avant chaque début de lot.
