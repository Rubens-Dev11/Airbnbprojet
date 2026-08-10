# ADR-002 — Les artefacts des skills vivent sous `docs/`

- **Statut** : Acceptée
- **Date** : 2026-08-07
- **Domaine** : Processus

## Contexte

Les 21 skills de `agent-skills/` produisent des artefacts à des chemins qui leur
sont propres : `analysis/idea_analysis.md`, `strategy/vision.md`,
`product/mvp_scope.md`, `tech/stack.md`, `execution/tasks.md`,
`documentation/PRD.md`, `memory/decisions/ADR-XXX.md`.

Appliqués tels quels, ces chemins créeraient **sept dossiers de documentation à
la racine**, en plus de `docs/` qui existe déjà. Deux arborescences
documentaires parallèles : c'est le premier piège listé dans les règles de
travail — « arbres de fichiers dupliqués : un correctif appliqué à une copie
morte, sans effet visible ». Une décision finirait par exister en deux versions
divergentes, et personne ne saurait laquelle fait foi.

## Décision

Les artefacts des skills conservent **leur sous-chemin**, préfixé par `docs/` :

| Skill produit | Chemin réel dans ce dépôt |
|---|---|
| `analysis/idea_analysis.md` | `docs/analysis/idea_analysis.md` |
| `strategy/vision.md` | `docs/strategy/vision.md` |
| `product/mvp_scope.md` | `docs/product/mvp_scope.md` |
| `tech/stack.md` | `docs/tech/stack.md` |
| `execution/tasks.md` | `docs/execution/tasks.md` |
| `documentation/PRD.md` | `docs/documentation/PRD.md` |
| `memory/decisions/ADR-XXX.md` | `docs/memory/decisions/ADR-XXX.md` |

La règle est mécanique et sans exception : **préfixer par `docs/`, ne rien
renommer d'autre**. Un agent qui suit un skill à la lettre n'a qu'une seule
transformation à appliquer, et la traçabilité skill → artefact reste intacte.

`agent-skills/` reste à la racine : ce sont des instructions, pas des artefacts.

## Alternatives rejetées

**Suivre les chemins des skills à la lettre.** Rejetée : sept dossiers à la
racine d'un dépôt qui contiendra aussi `apps/`, `packages/` et `supabase/`.
La racine devient illisible, et `docs/` deviendrait une huitième arborescence
concurrente.

**Tout mettre à plat dans `docs/`.** Rejetée : casse la correspondance avec les
skills, qui se référencent mutuellement par chemin.

**Modifier les skills pour qu'ils écrivent dans `docs/`.** Rejetée pour
l'instant : ils viennent d'être rapatriés, les modifier immédiatement ferait
perdre la version d'origine comme point de comparaison. À reconsidérer une fois
qu'ils auront été utilisés une fois pour de vrai.

## Conséquences

**Positives.** Une seule arborescence documentaire. Les skills restent
utilisables sans réécriture.

**Négatives, assumées.** Tout agent lisant un skill doit connaître cette règle.
Elle est donc rappelée dans `docs/README.md` et dans `agent-skills/README.md`.

## Artefacts liés

- `agent-skills/README.md`, `docs/README.md`
- `docs/regles-de-travail.md`, tableau des pièges génériques
