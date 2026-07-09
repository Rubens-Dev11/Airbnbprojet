# Skill Name

generate_prd

# Description

Compile tous les artefacts stratégiques et produit en un PRD (Product Requirements Document) unique : la source de vérité produit pour tous les agents et parties prenantes.

# Capabilities

- Agréger vision, business model, scope MVP et user stories en un document cohérent
- Détecter et résoudre les contradictions entre artefacts
- Versionner le PRD et tracer les changements de scope
- Produire un document lisible par des humains ET exploitable par des agents

# Inputs

- `strategy/vision.md`, `strategy/business_model.md`, `strategy/roadmap.md`
- `product/mvp_scope.md`, `product/user_stories.md`, `product/backlog.md`
- Cahier des charges original (`CDC_Plateforme_Douala_v2.pdf`)

# Outputs

- `documentation/PRD.md` (versionné) contenant :
  - Résumé exécutif (1 page)
  - Problème, cibles, personas
  - Scope MVP (IN/OUT) et user stories complètes
  - Métriques de succès
  - Roadmap et jalons
  - Changelog des versions du PRD

# Instructions

1. Relire tous les artefacts d'entrée et vérifier leur cohérence (scope MVP vs roadmap vs stories).
2. Signaler toute contradiction au CEO Agent avant rédaction ; la trancher, puis rédiger.
3. Structurer le PRD : résumé exécutif → problème → solution → scope → stories → métriques → roadmap.
4. Croiser avec le cahier des charges original : lister explicitement les exigences du CDC reportées hors MVP.
5. Versionner (v1.0, v1.1...) ; tout changement de scope ultérieur passe par une mise à jour du PRD avec entrée changelog.
6. Diffuser aux agents : le PRD prime sur tout artefact antérieur en cas de conflit.

# Example Usage

> Input : tous les artefacts stratégie + produit de la plateforme Douala.
>
> Output : `PRD.md v1.0` — 8 sections. Contradiction détectée et résolue : le CDC exigeait la messagerie au MVP, le scope l'a reportée en Phase 2 (décision CEO Agent consignée, ADR-007). Exigences CDC couvertes au MVP : 14/19.
