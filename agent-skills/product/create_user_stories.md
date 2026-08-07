# Skill Name

create_user_stories

# Description

Convertit le scope MVP en user stories complètes avec critères d'acceptation testables, prêtes à être priorisées puis découpées en tâches techniques.

# Capabilities

- Rédiger des stories au format standard "En tant que... je veux... afin de..."
- Écrire des critères d'acceptation au format Given/When/Then
- Regrouper les stories en epics cohérents
- Couvrir les cas d'erreur et les états vides, pas uniquement le chemin heureux

# Inputs

- `product/mvp_scope.md`
- Maquettes de référence (`fluxdereservation/`)

# Outputs

- `product/user_stories.md` contenant :
  - Epics (ex: Recherche, Fiche logement, Compte, Réservation)
  - Stories numérotées (US-001, US-002...) avec critères d'acceptation
  - États d'erreur et cas limites par story

# Instructions

1. Créer un epic par grande zone du parcours critique.
2. Pour chaque écran/action du MVP, rédiger une story : "En tant que [persona], je veux [action] afin de [bénéfice]".
3. Ajouter 2-5 critères d'acceptation Given/When/Then par story.
4. Ajouter systématiquement : état vide, état de chargement, état d'erreur.
5. Numéroter les stories (US-XXX) pour la traçabilité dans les tâches et commits.
6. Vérifier que 100% du parcours critique est couvert par des stories.
7. Transmettre à `prioritize_features`.

# Example Usage

> Input : scope MVP plateforme Douala.
>
> Output :
> **US-004 — Recherche de logement**
> En tant que voyageur, je veux filtrer les logements par quartier et dates afin de trouver un logement disponible.
> - Given des logements existent, When je sélectionne "Akwa" + dates, Then seuls les logements disponibles à Akwa s'affichent.
> - Given aucun résultat, When la recherche est vide, Then un état vide avec suggestion s'affiche.
