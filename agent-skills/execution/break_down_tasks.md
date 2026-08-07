# Skill Name

break_down_tasks

# Description

Découpe les user stories priorisées en tâches techniques atomiques, autonomes et vérifiables, directement exécutables par un Dev Agent sans contexte supplémentaire.

# Capabilities

- Décomposer une story en tâches de moins d'une journée-agent
- Rendre chaque tâche autonome : contexte, fichiers concernés, definition of done incluse
- Expliciter les dépendances entre tâches (graphe d'exécution)
- Identifier les tâches parallélisables

# Inputs

- `product/backlog.md` (lot courant)
- `tech/architecture.md`
- `documentation/technical_specs.md`

# Outputs

- `execution/tasks.md` contenant, pour chaque tâche :
  - ID (T-XXX), story parente (US-XXX), titre
  - Description technique précise avec fichiers à créer/modifier
  - Definition of Done vérifiable
  - Dépendances (bloqué par / bloque)
  - Estimation (S/M/L) et parallélisable oui/non

# Instructions

1. Prendre les stories du lot courant dans l'ordre du backlog.
2. Découper chaque story en tâches techniques : schéma DB, route API, composant UI, intégration, test.
3. Chaque tâche doit être réalisable sans poser de question : inclure les chemins de fichiers, les contrats d'API concernés, les maquettes de référence.
4. Écrire une Definition of Done binaire (ex: "la route retourne 401 sans session, 200 avec").
5. Construire le graphe de dépendances et marquer les tâches parallélisables.
6. Vérifier qu'aucune tâche ne dépasse une journée-agent ; sinon re-découper.
7. Transmettre à `assign_tasks_to_agents`.

# Example Usage

> Input : US-008 "Réserver un logement".
>
> Output :
> - T-021 : table `bookings` + contrainte anti-chevauchement (S, bloque T-022/T-023)
> - T-022 : route POST `/api/bookings` avec vérification session + disponibilité (M, parallèle avec T-023)
> - T-023 : composant `BookingForm` avec sélection de dates (M, réf. capture `fluxdereservation/17.png`)
> - T-024 : page de confirmation (S, bloquée par T-022 et T-023)
