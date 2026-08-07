# Skill Name

generate_technical_specs

# Description

Produit les spécifications techniques détaillées à partir du PRD et de l'architecture : le document d'implémentation de référence que les Dev Agents suivent à la lettre.

# Capabilities

- Spécifier chaque fonctionnalité au niveau implémentation (routes, schémas, composants)
- Définir les contrats d'API exhaustifs avec codes d'erreur
- Documenter le schéma DB avec migrations
- Spécifier les règles de validation, d'autorisation et les cas limites
- Maintenir la traçabilité story → spec → tâche

# Inputs

- `documentation/PRD.md`
- `tech/architecture.md`, `tech/stack.md`
- Maquettes de référence (`fluxdereservation/`, `InspirationsMaquettes/`)

# Outputs

- `documentation/technical_specs.md` contenant :
  - Schéma DB complet (DDL) et plan de migrations
  - Contrats d'API : route, méthode, payload, réponses, erreurs, règle d'autorisation
  - Spécification des écrans : composants, états, maquette de référence
  - Règles de validation et cas limites par fonctionnalité
  - Matrice de traçabilité US-XXX → sections de spec

# Instructions

1. Pour chaque user story du lot, dériver : données nécessaires, endpoints, écrans.
2. Écrire le DDL complet : tables, types, contraintes, index — aligné sur `tech/architecture.md`.
3. Spécifier chaque endpoint : entrée validée (schéma), sorties (200/4xx), règle d'autorisation explicite ("réservé au propriétaire du booking").
4. Spécifier chaque écran : composants, états (vide/chargement/erreur), maquette de référence exacte.
5. Lister les cas limites : dates de réservation qui se chevauchent, logement supprimé pendant la réservation, etc.
6. Construire la matrice de traçabilité pour que `break_down_tasks` puisse mapper chaque tâche.

# Example Usage

> Input : PRD v1.0 + architecture Douala.
>
> Output : DDL de 3 tables avec contrainte d'exclusion sur les dates de booking. 9 endpoints spécifiés. Écran "Fiche logement" : galerie (réf. `fluxdereservation/09.png`), calendrier de disponibilité, CTA réserver — 3 états spécifiés. Cas limite documenté : deux réservations simultanées sur les mêmes dates → la contrainte DB tranche, le second reçoit 409.
