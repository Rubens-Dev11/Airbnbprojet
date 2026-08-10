# Documentation projet

Point d'entrée de la documentation. Tout ce qui figure ici a été **constaté**,
pas déduit. Quand une information n'a pas pu être vérifiée, c'est écrit
explicitement.

## Ordre de lecture

| # | Document | À quoi il sert | Quand le mettre à jour |
|---|---|---|---|
| 0 | [regles-de-travail.md](regles-de-travail.md) | **Méthode de travail. Contraignant.** À lire avant toute contribution. | Rarement — décision du porteur du projet |
| 1 | [memory/decisions/INDEX.md](memory/decisions/INDEX.md) | **Registre des décisions (ADR). Fait foi.** | À chaque décision structurante, via le skill `store_decisions` |
| 2 | [tech/stack.md](tech/stack.md) | Stack retenue, conventions de code, arborescence cible | À chaque changement de stack ou de convention |
| 3 | [etat-des-lieux.md](etat-des-lieux.md) | Document de reprise : état réel du dépôt, constats, preuves | À chaque fin de tâche |
| 4 | [roadmap.md](roadmap.md) | Découpage en sprints, backlog, définition de « terminé » | À chaque fin de sprint |
| 5 | [fonctionnalites-critiques.md](fonctionnalites-critiques.md) | Liste de non-régression, à vérifier avant/après chaque modification | Dès qu'une fonctionnalité est livrée |
| 6 | [veille-concurrence.md](veille-concurrence.md) | Ce que fait la concurrence locale réelle | À chaque nouvelle observation |
| 7 | [structure-cible.md](structure-cible.md) | Réorganisation des dossiers de référence + commandes | Quand la structure évolue |
| 8 | [journal.md](journal.md) | Journal des modifications : quoi, **pourquoi**, et ce qui a été vérifié | À chaque tâche, sans exception |
| — | [decisions.md](decisions.md) | ~~Registre provisoire~~ — **remplacé par le registre ADR** | Ne plus modifier |

## Artefacts des skills

Les 21 skills de `../agent-skills/` produisent des artefacts à des chemins qui
leur sont propres (`strategy/vision.md`, `product/mvp_scope.md`,
`tech/stack.md`, `memory/decisions/ADR-XXX.md`…).

**Règle unique, sans exception : préfixer ce chemin par `docs/`, ne rien
renommer d'autre.** Motif et alternatives dans
[ADR-002](memory/decisions/ADR-002-arborescence-documentaire-unique.md) : deux
arborescences documentaires parallèles finissent toujours par diverger.

## Sources de vérité

- **Produit** : `../CDC_Plateforme_Douala_v2.pdf` (cahier des charges v2.0).
  Ses lacunes et contradictions identifiées sont listées dans
  [etat-des-lieux.md](etat-des-lieux.md), section « Constats sur le cahier des
  charges ».
- **Méthode** : [regles-de-travail.md](regles-de-travail.md).
- **État réel** : le dépôt lui-même. En cas de contradiction entre un document
  et le code, **c'est le code qui a raison** — et le document doit être corrigé
  dans la foulée.

> **Le conflit entre les deux références produit est tranché.**
> [ADR-001](memory/decisions/ADR-001-prd-source-de-verite-unique.md) fait de
> `docs/documentation/PRD.md` la source de vérité unique. Le CDC v2.0 et
> `plan.md` deviennent des documents d'entrée : ils gardent leur valeur de
> contexte, ils ne pilotent plus le développement.
>
> **Le PRD n'est pas encore rédigé.** Tant qu'il ne l'est pas, aucun code
> applicatif métier n'est écrit — il suivrait l'un des deux documents au
> hasard. La structure du projet, elle, peut avancer : elle ne dépend d'aucun
> arbitrage fonctionnel ([ADR-003](memory/decisions/ADR-003-monorepo-expo-nextjs.md),
> [ADR-004](memory/decisions/ADR-004-supabase-et-docker.md)).

## Convention

Deux documents qui couvrent la même matière et ne sont pas générés l'un depuis
l'autre se mettent à jour **ensemble**. C'est le cas de
[etat-des-lieux.md](etat-des-lieux.md) et [journal.md](journal.md) : toute
entrée du journal doit se refléter dans l'état des lieux.
