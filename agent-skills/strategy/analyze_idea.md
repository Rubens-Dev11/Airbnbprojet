# Skill Name

analyze_idea

# Description

Analyse une idée produit brute pour en extraire le problème résolu, la cible, la proposition de valeur et les risques. Premier skill exécuté dans tout nouveau cycle projet.

# Capabilities

- Extraire le problème central et la douleur utilisateur
- Identifier les segments cibles (ex: voyageurs, hôtes, propriétaires à Douala)
- Formuler la proposition de valeur unique (UVP)
- Analyser la concurrence directe et indirecte (Airbnb, Booking, solutions locales)
- Identifier les risques majeurs (marché, technique, réglementaire, paiement local)
- Produire un verdict GO / NO-GO / PIVOT argumenté

# Inputs

- Description de l'idée (texte libre)
- Cahier des charges si disponible (`CDC_Plateforme_Douala_v2.pdf`)
- Contexte marché (pays, ville, contraintes locales)

# Outputs

- `analysis/idea_analysis.md` contenant :
  - Problème / Solution
  - Segments cibles avec personas courts
  - UVP en une phrase
  - Matrice concurrentielle
  - Top 5 risques avec mitigation
  - Verdict GO / NO-GO / PIVOT

# Instructions

1. Lire l'intégralité de l'idée et du cahier des charges.
2. Reformuler le problème en une phrase : "X a du mal à Y parce que Z".
3. Lister 2-4 segments cibles ; pour chacun : besoin, fréquence, capacité de paiement.
4. Rédiger l'UVP : pourquoi ce produit et pas Airbnb/Booking ?
5. Construire la matrice concurrentielle (fonctionnalités vs concurrents, avantage local).
6. Identifier les 5 risques principaux ; noter chacun (probabilité x impact) et proposer une mitigation.
7. Conclure par un verdict argumenté en 3 lignes maximum.
8. Transmettre le résultat à `define_vision` et le stocker via `memory/store_decisions`.

# Example Usage

> Input : "Plateforme de location de logements courte durée à Douala, adaptée aux moyens de paiement locaux (Mobile Money)."
>
> Output : `idea_analysis.md` → Problème : les voyageurs à Douala ne peuvent pas réserver en ligne avec MTN MoMo/Orange Money. UVP : "Le Airbnb du Cameroun, payable en Mobile Money". Risque #1 : confiance hôte/voyageur → mitigation : vérification d'identité + caution. Verdict : GO.
