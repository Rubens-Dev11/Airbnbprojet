# Skill Name

store_decisions

# Description

Enregistre toute décision structurante (stratégique, produit, technique) au format ADR (Architecture Decision Record) dans une mémoire persistante consultable par tous les agents.

# Capabilities

- Capturer les décisions au format ADR standardisé
- Indexer par domaine (stratégie, produit, tech, exécution) et par date
- Tracer le contexte, les alternatives rejetées et les conséquences
- Marquer les décisions remplacées (superseded) sans les supprimer

# Inputs

- Décision à enregistrer : contexte, décision, alternatives, auteur (agent)
- Domaine et artefacts liés (US-XXX, T-XXX, fichiers)

# Outputs

- `memory/decisions/ADR-XXX-titre.md` contenant :
  - Statut : proposée / acceptée / remplacée par ADR-YYY
  - Contexte, décision, alternatives rejetées avec raisons
  - Conséquences attendues
  - Liens vers artefacts concernés
- `memory/decisions/INDEX.md` mis à jour

# Instructions

1. Vérifier qu'une décision similaire n'existe pas déjà (consulter `INDEX.md`).
2. Attribuer le prochain numéro ADR séquentiel.
3. Rédiger : contexte (pourquoi maintenant), décision (une phrase claire), alternatives rejetées (avec raisons), conséquences (positives ET négatives).
4. Si la décision en remplace une autre : marquer l'ancienne "remplacée par ADR-XXX", ne jamais la supprimer.
5. Mettre à jour `INDEX.md` (numéro, titre, domaine, date, statut).
6. Règle : toute décision qui impacte le scope, l'architecture ou le budget DOIT passer par ce skill.

# Example Usage

> Input : décision du CEO Agent de reporter le paiement Mobile Money en Phase 2.
>
> Output : `ADR-007-paiement-a-larrivee-au-mvp.md` — Contexte : intégration Notch Pay = 2 semaines de dev + validation KYC. Décision : MVP avec paiement à l'arrivée, Mobile Money en Phase 2. Alternative rejetée : bloquer le MVP sur l'intégration paiement. Conséquence négative assumée : pas de commission automatique au MVP.
