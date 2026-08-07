# Skill Name

generate_business_model

# Description

Génère un business model complet (format Lean Canvas) avec modèle de revenus chiffré, structure de coûts et hypothèses à valider en priorité.

# Capabilities

- Construire un Lean Canvas complet
- Définir le modèle de revenus (commission, abonnement, frais de service)
- Estimer les coûts (infra, paiement, acquisition, opérations)
- Calculer les unit economics de base (take rate, CAC, LTV estimés)
- Identifier les 3 hypothèses les plus risquées à tester en premier

# Inputs

- `strategy/vision.md`
- `analysis/idea_analysis.md`
- Données marché disponibles (prix moyens des nuitées, volumes estimés)

# Outputs

- `strategy/business_model.md` contenant :
  - Lean Canvas (9 blocs)
  - Modèle de revenus détaillé avec take rate
  - Structure de coûts mensuelle estimée
  - Unit economics (revenu par réservation, seuil de rentabilité)
  - Top 3 hypothèses risquées + plan de test

# Instructions

1. Remplir les 9 blocs du Lean Canvas à partir de la vision et de l'analyse.
2. Choisir le modèle de revenus principal (ex: commission 10-15% par réservation, côté hôte et/ou voyageur).
3. Estimer les coûts fixes (hébergement, domaines, outils) et variables (frais Mobile Money ~1-2%, SMS, support).
4. Calculer : revenu moyen par réservation, nombre de réservations pour couvrir les coûts.
5. Extraire les 3 hypothèses les plus risquées (ex: "les hôtes accepteront 12% de commission") et définir comment les tester.
6. Stocker via `memory/store_decisions`.

# Example Usage

> Input : vision de la plateforme Douala, nuitée moyenne 25 000 FCFA.
>
> Output : Commission 12% → 3 000 FCFA/réservation. Coûts fixes ~150 000 FCFA/mois → seuil : 50 réservations/mois. Hypothèse risquée #1 : les voyageurs paieront en ligne plutôt qu'à l'arrivée → test : MVP avec paiement à l'arrivée optionnel tracké.
