# Skill Name

analyze_github_repo

# Description

Inventorie et cartographie un repository GitHub : structure, technologies, assets, documentation, activité. Produit un état des lieux factuel avant tout audit ou décision technique.

# Capabilities

- Cartographier l'arborescence complète du repo
- Détecter le stack (frameworks, langages, package manager, lockfiles)
- Inventorier les assets non-code (maquettes, PDF, images, docs)
- Analyser l'historique git (activité, branches, contributeurs)
- Identifier ce qui existe vs ce qui manque pour démarrer le développement

# Inputs

- URL ou accès au repository (ex: `Rubens-Dev11/Airbnbprojet`)
- Branche cible

# Outputs

- `tech/repo_analysis.md` contenant :
  - Arborescence commentée
  - Stack détecté (ou "aucun code" si repo documentaire)
  - Inventaire des assets (maquettes, CDC, captures)
  - État des branches et activité récente
  - Liste des manques bloquants pour démarrer

# Instructions

1. Lister l'arborescence complète (`git ls-files` ou équivalent).
2. Chercher les marqueurs de stack : `package.json`, lockfiles, configs (next.config, etc.).
3. Inventorier les fichiers non-code : PDF (cahier des charges), images (maquettes), README.
4. Analyser `git log` : fréquence des commits, branches actives.
5. Croiser avec le cahier des charges : quels assets couvrent quelles fonctionnalités ?
6. Conclure : "repo prêt à coder" ou "repo documentaire — bootstrap nécessaire" avec liste des manques.
7. Transmettre à `audit_codebase` (si code présent) ou directement à `propose_architecture`.

# Example Usage

> Input : repo `Rubens-Dev11/Airbnbprojet`, branche `main`.
>
> Output : Repo documentaire — aucun code. Assets : CDC v2 (PDF), 10 maquettes d'inspiration, 23 captures du flux de réservation Airbnb, infos Play Store. Manques bloquants : aucun projet initialisé, pas de schéma DB, pas de design system. Recommandation : bootstrap Next.js + suivre `propose_architecture`.
