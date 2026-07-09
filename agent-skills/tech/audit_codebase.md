# Skill Name

audit_codebase

# Description

Audite la qualité, la sécurité et la dette technique d'une codebase existante. Produit un rapport actionnable avec sévérités, pour décider quoi corriger avant de construire dessus.

# Capabilities

- Évaluer la qualité du code (structure, duplication, conventions)
- Détecter les failles de sécurité courantes (secrets exposés, injections, auth faible)
- Mesurer la dette technique et les dépendances obsolètes
- Vérifier la couverture des tests et la CI/CD
- Prioriser les corrections par sévérité (Critique / Majeur / Mineur)

# Inputs

- `tech/repo_analysis.md`
- Accès au code source
- Standards du projet (si définis)

# Outputs

- `tech/audit_report.md` contenant :
  - Note globale par catégorie (architecture, sécurité, qualité, tests)
  - Liste des problèmes avec sévérité, fichier concerné, correction proposée
  - Dépendances obsolètes ou vulnérables
  - Plan de remédiation ordonné

# Instructions

1. Vérifier l'absence de secrets en clair (clés API, mots de passe) dans le code et l'historique git.
2. Auditer l'authentification et les autorisations : chaque route protégée vérifie-t-elle la session ?
3. Vérifier les requêtes DB : paramétrées ? scoping par userId ?
4. Évaluer la structure : séparation des responsabilités, composants réutilisables, taille des fichiers.
5. Lancer lint/typecheck/tests si disponibles et consigner les résultats.
6. Lister les dépendances avec vulnérabilités connues.
7. Classer chaque problème : Critique (bloque la prod), Majeur (risque réel), Mineur (dette).
8. Produire le plan de remédiation et le transmettre à `execution/break_down_tasks`.

# Example Usage

> Input : codebase Next.js du MVP après le Lot 1.
>
> Output : Critique : route `/api/bookings` sans vérification de session (fix : middleware auth). Majeur : requêtes non scopées par userId. Mineur : composant `ListingCard` dupliqué 3 fois. Plan : corriger les 2 critiques avant le Lot 2.
