# Skill Name

define_vision

# Description

Transforme l'analyse d'idée en vision produit claire : mission, vision à 3 ans, objectifs mesurables et principes directeurs qui guideront toutes les décisions futures.

# Capabilities

- Formuler une mission en une phrase
- Définir une vision à 12 et 36 mois
- Fixer 3-5 objectifs SMART (North Star Metric incluse)
- Établir les principes de décision non négociables
- Définir ce que le produit NE fera PAS (anti-scope)

# Inputs

- `analysis/idea_analysis.md` (sortie de `analyze_idea`)
- Contraintes fondateur (budget, délais, équipe)

# Outputs

- `strategy/vision.md` contenant :
  - Mission (1 phrase)
  - Vision 12 mois / 36 mois
  - North Star Metric + 3-5 KPI
  - 5 principes de décision
  - Anti-scope explicite

# Instructions

1. Lire l'analyse d'idée et extraire le problème + la cible principale.
2. Rédiger la mission : "Permettre à [cible] de [résultat] grâce à [moyen]".
3. Décrire l'état du produit à 12 mois (MVP consolidé) puis 36 mois (échelle régionale).
4. Choisir la North Star Metric (ex: nuits réservées/mois) et 3-5 KPI dérivés.
5. Écrire 5 principes de décision (ex: "Mobile-first toujours", "Paiement local avant international").
6. Lister explicitement 5 choses hors scope (ex: pas de vols, pas de longue durée au MVP).
7. Faire valider par le CEO Agent puis stocker via `memory/store_decisions`.

# Example Usage

> Input : `idea_analysis.md` de la plateforme Douala.
>
> Output : Mission : "Permettre à tout voyageur au Cameroun de réserver un logement de confiance en 3 clics, payable en Mobile Money." North Star : nuits réservées/mois. Anti-scope MVP : pas d'expériences, pas de multi-villes.
