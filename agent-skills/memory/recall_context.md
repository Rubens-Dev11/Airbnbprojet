# Skill Name

recall_context

# Description

Restitue le contexte pertinent (décisions, historique, métriques, résolutions passées) à n'importe quel agent avant qu'il n'agisse. Évite les décisions contradictoires et les erreurs déjà commises.

# Capabilities

- Rechercher dans les ADR par domaine, mot-clé ou artefact lié
- Reconstituer l'historique d'une fonctionnalité (stories, tâches, décisions, blocages)
- Fournir les métriques historiques (vélocité, blocages récurrents)
- Détecter qu'une action envisagée contredit une décision existante

# Inputs

- Requête de contexte : sujet, artefact (US-XXX, T-XXX) ou question
- Agent demandeur et action envisagée

# Outputs

- Synthèse de contexte contenant :
  - Décisions ADR applicables (avec statut)
  - Historique pertinent (blocages similaires, résolutions)
  - Alerte si l'action envisagée contredit une ADR active
  - Références des fichiers sources

# Instructions

1. Parser la requête et identifier le domaine et les artefacts concernés.
2. Chercher dans `memory/decisions/INDEX.md` toutes les ADR liées (actives d'abord, remplacées ensuite).
3. Chercher dans `execution/resolutions.md` les blocages similaires déjà résolus.
4. Si l'action envisagée contredit une ADR active : émettre une ALERTE explicite avec référence — l'agent doit alors soit se conformer, soit demander une nouvelle ADR au CEO Agent.
5. Synthétiser en moins d'une page : uniquement le contexte actionnable.
6. Règle : tout agent DOIT appeler ce skill avant une décision structurante ou une tâche complexe.

# Example Usage

> Input : Backend Agent s'apprête à intégrer Stripe pour le paiement (T-031).
>
> Output : ALERTE — contredit ADR-007 (paiement à l'arrivée au MVP) et ADR-009 (Notch Pay choisi pour la Phase 2, pas Stripe — Mobile Money requis au Cameroun). Recommandation : suspendre T-031 et escalader au CEO Agent.
