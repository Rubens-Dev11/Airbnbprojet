# Skill Name

prioritize_features

# Description

Priorise les user stories avec la méthode RICE + MoSCoW pour produire un backlog ordonné, exécutable séquentiellement par les Dev Agents.

# Capabilities

- Scorer chaque story : Reach, Impact, Confidence, Effort (RICE)
- Classer en Must / Should / Could / Won't (MoSCoW)
- Détecter les dépendances entre stories et ajuster l'ordre
- Produire un backlog ordonné en sprints/lots

# Inputs

- `product/user_stories.md`
- `strategy/roadmap.md` (contraintes de phase)
- Capacité estimée des Dev Agents

# Outputs

- `product/backlog.md` contenant :
  - Tableau RICE de toutes les stories
  - Classification MoSCoW
  - Backlog ordonné avec dépendances explicites
  - Découpage en lots de livraison (Lot 1, Lot 2...)

# Instructions

1. Scorer chaque story : Reach (utilisateurs touchés), Impact (1-3), Confidence (%), Effort (jours). Score = (R×I×C)/E.
2. Classer MoSCoW : Must = bloque le parcours critique ; Won't = hors MVP.
3. Identifier les dépendances techniques (ex: auth avant réservation) et remonter les stories bloquantes.
4. Grouper en lots livrables : chaque lot doit produire quelque chose de démontrable.
5. Valider avec le CEO Agent que le Lot 1 correspond bien au chemin le plus court vers la validation de l'hypothèse.
6. Transmettre à `execution/break_down_tasks`.

# Example Usage

> Input : 18 user stories du MVP Douala.
>
> Output : Lot 1 : US-001 (schéma DB), US-002 (auth), US-004 (recherche), US-005 (fiche logement). Lot 2 : US-008 (réservation), US-009 (confirmation). US-014 (avis) → Won't (Phase 2). Dépendance : US-008 bloquée par US-002.
