# Documentation projet

Point d'entrée de la documentation. Tout ce qui figure ici a été **constaté**,
pas déduit. Quand une information n'a pas pu être vérifiée, c'est écrit
explicitement.

## Ordre de lecture

| # | Document | À quoi il sert | Quand le mettre à jour |
|---|---|---|---|
| 0 | [regles-de-travail.md](regles-de-travail.md) | **Méthode de travail. Contraignant.** À lire avant toute contribution. | Rarement — décision du porteur du projet |
| 1 | [etat-des-lieux.md](etat-des-lieux.md) | Document de reprise : état réel du dépôt, constats, preuves | À chaque fin de tâche |
| 2 | [decisions.md](decisions.md) | Décisions arrêtées + arbitrages en attente | Dès qu'une décision est prise ou ouverte |
| 3 | [roadmap.md](roadmap.md) | Découpage en sprints, backlog, définition de « terminé » | À chaque fin de sprint |
| 4 | [fonctionnalites-critiques.md](fonctionnalites-critiques.md) | Liste de non-régression, à vérifier avant/après chaque modification | Dès qu'une fonctionnalité est livrée |
| 5 | [veille-concurrence.md](veille-concurrence.md) | Ce que fait la concurrence locale réelle | À chaque nouvelle observation |
| 6 | [structure-cible.md](structure-cible.md) | Arborescence visée + commandes de réorganisation | Quand la structure évolue |
| 7 | [journal.md](journal.md) | Journal des modifications : quoi, **pourquoi**, et ce qui a été vérifié | À chaque tâche, sans exception |

## Sources de vérité

- **Produit** : `../CDC_Plateforme_Douala_v2.pdf` (cahier des charges v2.0).
  Ses lacunes et contradictions identifiées sont listées dans
  [etat-des-lieux.md](etat-des-lieux.md), section « Constats sur le cahier des
  charges ».
- **Méthode** : [regles-de-travail.md](regles-de-travail.md).
- **État réel** : le dépôt lui-même. En cas de contradiction entre un document
  et le code, **c'est le code qui a raison** — et le document doit être corrigé
  dans la foulée.

> ⚠ **Il y a aujourd'hui deux références produit contradictoires.** Le CDC
> v2.0, et un `plan.md` de 242 lignes qui dort sur la branche distante
> `check-github-repo-airbnbprojet`, jamais fusionnée. Ils divergent sur
> l'architecture, l'authentification, le calendrier du paiement et
> l'hébergement. Détail dans [etat-des-lieux.md](etat-des-lieux.md) §5,
> arbitrage à rendre dans [decisions.md](decisions.md) D-06. **Tant que ce
> point n'est pas tranché, aucune ligne de code applicatif ne devrait être
> écrite** : elle suivrait l'un des deux documents au hasard.

## Convention

Deux documents qui couvrent la même matière et ne sont pas générés l'un depuis
l'autre se mettent à jour **ensemble**. C'est le cas de
[etat-des-lieux.md](etat-des-lieux.md) et [journal.md](journal.md) : toute
entrée du journal doit se refléter dans l'état des lieux.
