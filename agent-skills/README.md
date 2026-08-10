# Système Multi-Agents — Airbnbprojet (Plateforme Douala)

Système de skills permettant à un **CEO Agent** autonome de piloter le projet de bout en bout : de l'idée jusqu'à la livraison du code.

> ## ⚠ Règle de chemin, à appliquer avant d'écrire un artefact
>
> Les skills ci-dessous indiquent des chemins de sortie comme
> `strategy/vision.md`, `product/mvp_scope.md`, `tech/stack.md` ou
> `memory/decisions/ADR-XXX.md`.
>
> Dans ce dépôt, **tout artefact de skill est préfixé par `docs/`** :
> `tech/stack.md` s'écrit en `docs/tech/stack.md`,
> `memory/decisions/INDEX.md` en `docs/memory/decisions/INDEX.md`.
> Aucune autre transformation : le sous-chemin est conservé tel quel, pour que
> la correspondance skill → artefact reste lisible.
>
> Motif et alternatives écartées :
> [ADR-002](../docs/memory/decisions/ADR-002-arborescence-documentaire-unique.md).
> Deux arborescences documentaires parallèles finissent toujours par diverger,
> et un correctif appliqué à la copie morte ne produit aucun effet visible.
>
> **Décisions déjà rendues** — à lire avant d'exécuter un skill, comme
> l'impose `memory/recall_context` :
> [docs/memory/decisions/INDEX.md](../docs/memory/decisions/INDEX.md).

## Architecture Multi-Agent

```
                        ┌─────────────────┐
                        │    CEO AGENT    │
                        │ (Orchestrateur) │
                        └────────┬────────┘
           ┌───────────┬────────┼─────────┬──────────────┐
           ▼           ▼        ▼         ▼              ▼
     ┌──────────┐ ┌─────────┐ ┌──────┐ ┌─────────┐ ┌──────────┐
     │ STRATEGY │ │ PRODUCT │ │ CTO  │ │ PM AGENT│ │  MEMORY  │
     │  AGENT   │ │  AGENT  │ │AGENT │ │(Exécut.)│ │  AGENT   │
     └──────────┘ └─────────┘ └──┬───┘ └────┬────┘ └──────────┘
                                 │          │
                                 ▼          ▼
                          ┌───────────────────────┐
                          │   DEV AGENTS (1..N)   │
                          │ Frontend / Backend /  │
                          │ DB / QA               │
                          └───────────────────────┘
```

## Rôles des agents

| Agent | Rôle | Skills utilisés |
|---|---|---|
| **CEO Agent** | Décide, arbitre, orchestre le cycle complet | Tous (orchestration) |
| **Strategy Agent** | Vision, business model, roadmap | `strategy/*` |
| **Product Agent** | MVP, user stories, priorisation | `product/*` |
| **CTO Agent** | Audit repo, architecture, stack | `tech/*` |
| **PM Agent** | Découpage, assignation, suivi, déblocage | `execution/*` |
| **Dev Agents** | Implémentation des tâches assignées | Reçoivent specs via `execution/assign_tasks_to_agents` |
| **Memory Agent** | Mémoire des décisions, contexte, amélioration continue | `memory/*` |

## Workflow global du système

```
1. IDÉE + CAHIER DES CHARGES (CDC_Plateforme_Douala_v2.pdf)
        │
        ▼
2. strategy/analyze_idea ──► strategy/define_vision ──► strategy/generate_business_model
        │
        ▼
3. tech/analyze_github_repo ──► tech/audit_codebase
        │
        ▼
4. strategy/generate_product_roadmap
        │
        ▼
5. product/define_mvp ──► product/create_user_stories ──► product/prioritize_features
        │
        ▼
6. tech/choose_tech_stack ──► tech/propose_architecture
        │
        ▼
7. documentation/generate_prd ──► documentation/generate_technical_specs
        │
        ▼
8. execution/break_down_tasks ──► execution/assign_tasks_to_agents
        │
        ▼
9. BOUCLE D'EXÉCUTION:
   execution/track_progress ◄──► execution/unblock_issues
        │
        ▼
10. memory/store_decisions ──► memory/recall_context ──► memory/improve_strategy
        │
        └──► retour à l'étape 4 (itération suivante)
```

## Structure des skills

```
agent-skills/
├── strategy/       analyze_idea, define_vision, generate_business_model, generate_product_roadmap
├── product/        define_mvp, create_user_stories, prioritize_features
├── tech/           analyze_github_repo, audit_codebase, propose_architecture, choose_tech_stack
├── execution/      break_down_tasks, assign_tasks_to_agents, track_progress, unblock_issues
├── documentation/  generate_prd, generate_technical_specs
└── memory/         store_decisions, recall_context, improve_strategy
```

## Règles d'orchestration du CEO Agent

1. **Jamais d'exécution sans plan** : les phases 1-7 doivent produire des artefacts validés avant tout code.
2. **Une source de vérité** : le PRD et les specs techniques font autorité sur les Dev Agents.
3. **Boucle courte** : `track_progress` tourne à chaque itération ; tout blocage > 1 cycle déclenche `unblock_issues`.
4. **Mémoire obligatoire** : toute décision structurante passe par `store_decisions` (format ADR).
5. **Amélioration continue** : à chaque fin de milestone, `improve_strategy` révise la roadmap.
