# Skill Name

define_mvp

# Description

Définit le périmètre exact du MVP : le plus petit produit qui valide l'hypothèse principale avec de vrais utilisateurs. Trace une frontière stricte entre "dans le MVP" et "hors MVP".

# Capabilities

- Identifier le parcours utilisateur critique unique
- Lister les fonctionnalités strictement nécessaires à ce parcours
- Rejeter explicitement tout le reste avec justification
- Définir les critères de succès du MVP
- Estimer la taille du MVP en nombre d'écrans et d'entités de données

# Inputs

- `strategy/roadmap.md` (Phase 1)
- Maquettes disponibles (`InspirationsMaquettes/`, `fluxdereservation/`)
- `strategy/business_model.md`

# Outputs

- `product/mvp_scope.md` contenant :
  - Parcours critique (étape par étape)
  - Liste IN : fonctionnalités du MVP
  - Liste OUT : fonctionnalités rejetées + raison + phase cible
  - Écrans nécessaires (mappés sur les maquettes)
  - Entités de données principales
  - Critères de succès chiffrés

# Instructions

1. Formuler l'hypothèse principale que le MVP doit valider.
2. Décrire le parcours critique : ex. rechercher un logement → consulter la fiche → créer un compte → réserver → confirmer.
3. Pour chaque fonctionnalité candidate, poser la question : "le parcours critique casse-t-il sans elle ?" Si non → OUT.
4. Mapper chaque étape du parcours sur les maquettes existantes du repo (`fluxdereservation/`).
5. Lister les entités de données : User, Listing, Booking, (Payment en phase 2).
6. Définir 2-3 critères de succès (ex: 10 réservations complètes en 30 jours).
7. Transmettre à `create_user_stories`.

# Example Usage

> Input : roadmap Phase 1 + 23 captures du flux de réservation Airbnb.
>
> Output : IN : recherche par quartier/dates, fiche logement avec photos, compte email, réservation avec paiement à l'arrivée. OUT : messagerie (Phase 2 — pas bloquant), avis (Phase 2), carte interactive (Phase 2), Mobile Money (Phase 2). 12 écrans, 3 entités.
