# Roadmap

Base : cahier des charges §11.1. Écarts par rapport au CDC signalés
explicitement. Ce document décrit un **plan**, pas un état — l'état réel est
dans `etat-des-lieux.md`.

> **Attention : il existe une troisième roadmap.** `plan.md`, sur la branche
> distante `check-github-repo-airbnbprojet`, propose son propre découpage en 6
> sprints, différent de celui du CDC et de celui-ci. Tant que l'arbitrage D-06
> n'a pas désigné un document de référence unique, **trois plannings
> contradictoires coexistent**. Comparaison au bas de ce document.

---

## Où en est le projet, réellement

**Sprint 0 — cadrage. En cours.** Aucun des 6 sprints du CDC n'est entamé.

| Sprint CDC | Livrable | État vérifié |
|---|---|---|
| 1 | Setup projet, BDD, authentification multi-rôles | Non commencé |
| 2 | CRUD logements + upload Cloudinary | Non commencé |
| 3 | Interface publique, recherche et filtres | Non commencé |
| 4 | Système de réservation complet | Non commencé |
| 5 | Agent IA chatbot avec function calling | Non commencé |
| 6 | Tests, corrections, déploiement production | Non commencé |

Preuve : aucun fichier `.ts`, `.tsx`, `.prisma`, `.sql`, aucun `package.json`,
aucun `Dockerfile` dans le dépôt. Listing récursif complet effectué le
7 août 2026.

---

## Sprint 0 — Cadrage (en cours)

Ce sprint n'existe pas dans le CDC. Il a été ajouté parce que l'audit a montré
que démarrer le Sprint 1 sans lui produirait du code à jeter.

| # | Tâche | État |
|---|---|---|
| 0.1 | Audit du dépôt existant | **Fait** — `etat-des-lieux.md` |
| 0.2 | Garde-fous de versionnement (`.gitignore`, `.gitattributes`) | **Fait** |
| 0.3 | Documentation de gouvernance (`docs/`) | **Fait** |
| 0.4 | Committer les 27 fichiers non versionnés | À faire — `structure-cible.md` §3 étape 1 |
| 0.5 | Récupérer le travail de la branche `check-github-repo-airbnbprojet` | **À faire — bloquant, voir D-06** |
| 0.6 | Supprimer les 6 branches distantes vides `v0/group-xprience-*` | À faire — après validation |
| 0.7 | Étude terrain PUOL : volume d'annonces, couverture, ancienneté | **À faire — bloque D-01** |
| 0.8 | Arbitrage D-06 — document de référence unique | **À faire — bloquant** |
| 0.9 | Arbitrage D-01 — positionnement face à PUOL | **À faire — bloquant** |
| 0.10 | Arbitrage D-03 — architecture (monolithe ou séparé) | **À faire — bloquant Sprint 1** |
| 0.11 | Arbitrage D-02 — direction visuelle unique | **À faire — bloquant Sprint 3** |
| 0.12 | Arbitrage D-04 — périmètre v1.0, paiement dedans ou dehors | À faire |
| 0.13 | Publier la référence produit unique, corrigeant CDC-01 à CDC-07 | À faire — après 0.8 |
| 0.14 | Réorganisation des dossiers de référence | À faire — après 0.4 |

**Condition de sortie du Sprint 0** : 0.4, 0.5, 0.8, 0.9, 0.10 et 0.13
terminés. Les autres peuvent glisser.

---

## Sprints 1 à 6 — écarts recommandés par rapport au CDC

Le découpage du CDC est conservé. Trois modifications sont recommandées, à
valider dans l'arbitrage D-04.

### Écart 1 — Le calendrier de disponibilité entre au Sprint 1, pas au Sprint 4

Motif : le CDC §7 ne modélise la disponibilité que par un `disponible BOOLEAN`
sur `Property`. Un booléen ne représente pas un calendrier. Or le CDC §9 exige
« un logement accepté bloque automatiquement les dates » et le §5.2 exige une
vérification de disponibilité en temps réel. Corriger le modèle au Sprint 4,
une fois les entités et l'API en place, coûte une migration de données et une
réécriture de la couche réservation. Le modèle de disponibilité doit être posé
avec le schéma initial.

### Écart 2 — La position de l'agent IA dépend de l'arbitrage D-01

Le CDC le place au Sprint 5. Si l'option A de D-01 est retenue (l'IA comme
différenciateur face à PUOL), il devient le cœur du produit et doit être
prototypé beaucoup plus tôt — au moins une version jetable au Sprint 2, pour
valider que la recherche conversationnelle en français tient la route sur des
requêtes réelles. Un différenciateur qu'on découvre au sprint 5 est un
différenciateur qu'on découvre trop tard.

### Écart 3 — 8 sprints, ou périmètre v1.0 réduit

Le sprint 6 du CDC concentre tests unitaires, tests d'intégration, **tests de
charge**, corrections, déploiement, documentation Swagger et deux guides
utilisateurs. C'est le sprint qui déborde toujours, et quand il déborde, c'est
la mise en production qui se fait sans les tests.

---

## Définition de « terminé »

Une tâche n'est terminée que si **tous** les points ci-dessous sont vrais, et
que chacun a été constaté par une sortie réelle lue — pas supposée.

1. Le code compile, et la sortie de la commande de build a été lue.
2. Les tests passent, et la sortie a été lue. Si un test échoue, c'est dit avec
   la sortie.
3. Le parcours a été exercé pour de vrai — pas seulement compilé. Un build
   réussi ne prouve pas qu'une fonctionnalité marche.
4. Les fonctionnalités critiques de `fonctionnalites-critiques.md` ont été
   vérifiées **avant et après** la modification.
5. `journal.md` porte une entrée qui dit **pourquoi**, et ce qui a été vérifié.
6. `etat-des-lieux.md` a été mis à jour dans le même mouvement.
7. Toute hypothèse prise faute d'information est écrite noir sur blanc.
8. Ce qui n'a pas été fait, et pourquoi, est écrit.
9. Un commit distinct, avec un message qui explique le pourquoi.

Une tâche « terminée » sans le point 3 n'est pas terminée. Un code HTTP 200, un
typecheck à zéro et un build vert ne prouvent aucun des trois qu'un parcours
fonctionne.

---

## Backlog hors v1.0

Repris du CDC §10, sans modification des horizons annoncés. Ces éléments ne
sont pas planifiés tant que la v1.0 n'est pas livrée.

| Horizon CDC | Fonctionnalité |
|---|---|
| 6 mois | Paiement Mobile Money (MTN MoMo, Orange Money) |
| 6 mois | Notifications WhatsApp (n8n + WhatsApp Business API) |
| 6 mois | Système d'avis et notation |
| 12 mois | Assistant vocal (Whisper + GPT-4o Audio) |
| 12 mois | Application mobile React Native |
| 12 mois | Géolocalisation (Google Maps ou Mapbox) |
| 18 mois | Multi-agences / marketplace |
| 18 mois | IA vocale temps réel (OpenAI Realtime) |

**Remarque issue de l'audit** : le paiement est placé à 6 mois par le CDC,
alors que le concurrent PUOL encaisse déjà une avance en ligne. Une v1.0 sans
aucun moyen de sécuriser une réservation laisse le produit sans réponse sur
le point exact où la confiance se joue — le CDC §1 identifie pourtant la
défiance comme le problème central du marché. `plan.md` §4.2 fait le même
constat et fait entrer le paiement dans le MVP. À trancher dans D-04.

---

## Les trois plannings en présence

| Sprint | CDC v2.0 §11.1 | `plan.md` §4.3 (branche non fusionnée) | Ce document |
|---|---|---|---|
| Amorçage | — | **Phase 0 : recruter 30-50 logements** avant ouverture | Absent — à reprendre |
| 1 | Setup, BDD, auth multi-rôles | Setup, schéma, auth, **design system** | + calendrier de disponibilité (écart 1) |
| 2 | CRUD logements + upload | Catalogue public, recherche, filtres | Position de l'IA dépend de D-01 (écart 2) |
| 3 | Interface publique, recherche | Espace propriétaire + admin | — |
| 4 | Réservation complète | Réservation, machine à états, expiration 24 h | — |
| 5 | Agent IA | Agent IA | — |
| 6 | Tests, corrections, déploiement | **Paiement Mobile Money** + tests de charge + déploiement | 8 sprints recommandés (écart 3) |

Trois différences de fond, pas de forme :

1. **`plan.md` ajoute une Phase 0 d'amorçage de l'offre.** Ni le CDC ni ce
   document ne la prévoient. C'est pourtant ce qui décide du lancement : une
   place de marché ouverte avec dix annonces ne convertit personne. **Le point
   le plus important des trois.**
2. **`plan.md` fait entrer le paiement dans le MVP**, le CDC le repousse à
   6 mois.
3. **`plan.md` définit des critères de sortie de sprint observables** — « un
   propriétaire réel publie une annonce seul », « l'agent réserve un logement en
   dialogue naturel ». Le CDC n'en donne aucun. Un livrable sans critère de
   sortie est un livrable qu'on déclare terminé sans l'avoir vu marcher.

**Recommandation** : quel que soit l'arbitrage D-06, reprendre de `plan.md` la
Phase 0 et les critères de sortie par sprint. Ce sont les deux apports les
moins discutables.
