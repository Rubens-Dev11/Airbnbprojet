# Skill Name

generate_product_roadmap

# Description

Produit une roadmap en phases (Now / Next / Later) alignée sur la vision et le business model, avec jalons mesurables et critères de passage entre phases.

# Capabilities

- Découper la vision en 3-4 phases livrables
- Définir des jalons avec critères de succès mesurables
- Aligner chaque phase sur une hypothèse business à valider
- Réviser la roadmap à chaque itération (entrée de `improve_strategy`)

# Inputs

- `strategy/vision.md`
- `strategy/business_model.md`
- `tech/audit_report.md` (état réel du code si existant)

# Outputs

- `strategy/roadmap.md` contenant :
  - Phase 0 : fondations (auth, données, design system)
  - Phase 1 : MVP (parcours réservation complet)
  - Phase 2 : croissance (paiement en ligne, avis, notifications)
  - Phase 3 : échelle (multi-villes, app mobile)
  - Pour chaque phase : objectif, livrables, critère de sortie, hypothèse validée

# Instructions

1. Lire vision, business model et audit technique.
2. Définir la Phase 1 (MVP) autour du parcours critique unique : chercher → voir → réserver → payer.
3. Placer en Phase 0 uniquement ce qui bloque le MVP (auth, schéma DB, design system).
4. Reporter en Phase 2+ tout ce qui n'invalide pas le MVP s'il est absent.
5. Pour chaque phase, écrire : objectif en 1 phrase, 3-6 livrables, critère de sortie chiffré.
6. Associer chaque phase à l'hypothèse business qu'elle teste.
7. Soumettre au CEO Agent, puis transmettre à `product/define_mvp`.

# Example Usage

> Input : vision Douala + audit d'un repo contenant uniquement maquettes et CDC.
>
> Output : Phase 0 : Next.js + Neon + auth (critère : un utilisateur peut créer un compte). Phase 1 : MVP réservation (critère : 10 réservations réelles). Phase 2 : Mobile Money (critère : 50% des paiements en ligne). Phase 3 : Yaoundé + app mobile.
