# Décisions

Deux sections : ce qui est **arrêté** (avec le motif, pour ne pas rouvrir le
débat tous les trois mois), et ce qui est **ouvert** (avec ce que chaque option
implique concrètement, pour que l'arbitrage soit rapide).

Une décision ouverte qui bloque une tâche est signalée comme telle.

---

## Décisions arrêtées

### DA-01 · Fins de ligne : LF partout dans le dépôt
**Date** : 2026-08-07 · **Statut** : appliqué (`.gitattributes`)
`core.autocrlf` valait `true` sur le poste. Sans normalisation explicite, le
contenu versionné dépend du poste qui commite, et cesse de correspondre octet
pour octet à ce qui est déployé. Exceptions : `.bat`, `.cmd`, `.ps1` restent en
CRLF, sinon ils ne s'exécutent pas correctement sous Windows.

### DA-02 · Les secrets ne rentrent jamais dans le dépôt
**Date** : 2026-08-07 · **Statut** : appliqué (`.gitignore`)
`.env` et toutes ses variantes sont ignorés, `.env.example` est l'exception
versionnée : il porte les **noms** de clés, jamais les valeurs. Motif : la stack
prévue manipule une clé OpenAI, des identifiants Cloudinary, un secret JWT et
une URL PostgreSQL. Un secret publié ne se dépublie pas, il se révoque.

### DA-03 · Les migrations Prisma sont versionnées
**Date** : 2026-08-07 · **Statut** : appliqué (`.gitignore`)
`prisma/migrations/` est explicitement hors des règles d'exclusion. Une
migration manquante rend incomplète toute base reconstruite ; les tests
continuent de passer et la production casse.

### DA-04 · Le CDC v2.0 reste la référence produit, **jusqu'à l'arbitrage D-06**
**Date** : 2026-08-07 · **Statut** : actif, mais fragilisé
Ses lacunes sont recensées dans `etat-des-lieux.md` §6 (CDC-01 à CDC-08). Elles
seront corrigées par une **v2.1**, pas par des correctifs oraux ni par des
écarts silencieux dans le code.

> **Réserve posée le jour même.** L'audit a découvert en cours de route un
> second document de référence, `plan.md`, sur une branche distante jamais
> fusionnée. Il contredit le CDC sur l'architecture, l'authentification, le
> calendrier du paiement et l'hébergement (`etat-des-lieux.md` §5.3). Tant que
> D-06 n'a pas tranché, **il y a deux références produit contradictoires** —
> situation à ne pas laisser durer.

### DA-05 · Documentation en français, dans `docs/`
**Date** : 2026-08-07 · **Statut** : appliqué
Aligné sur le CDC et sur la cible utilisateur. Le code, lui, suivra les
conventions anglaises usuelles de sa stack ; ce point sera tranché au Sprint 1
en même temps que la convention de nommage du schéma (le CDC §7 utilise des
noms de champs français : `prix_nuit`, `date_debut`).

---

## Arbitrages ouverts

> Ces points ne sont pas techniques. Ils appartiennent au porteur du projet.
> D-01, D-03 et D-06 **bloquent** le démarrage du Sprint 1 : commencer à coder
> avant de les trancher revient à écrire du code qu'il faudra jeter.

### D-06 · Que fait-on de `plan.md` et de la branche non fusionnée ? — **bloquant**

**Le fait** : la branche distante `check-github-repo-airbnbprojet` (`e60b0f4`,
2 commits du 9 juillet 2026, auteur `v0 <it+v0agent@vercel.com>`) contient un
plan stratégique de 242 lignes et 21 fichiers de méthode. Elle n'a jamais été
fusionnée et n'était visible depuis aucun poste. Détail complet et limites
identifiées : `etat-des-lieux.md` §5.

**Ce qu'il faut trancher, dans l'ordre :**

1. **Que devient le contenu ?** Fusionner `plan.md` **et** `agent-skills/` dans
   `main` ; ou n'extraire que `plan.md` vers `docs/` et abandonner le reste.
   `agent-skills/` décrit une méthode de travail par agents qui n'est pas celle
   du dépôt (`regles-de-travail.md`) : garder deux méthodes concurrentes coûtera
   plus cher que d'en supprimer une.
2. **Qui a autorité ?** Le CDC v2.0 et `plan.md` se contredisent sur sept
   sujets structurants. Il faut **un seul** document de référence. Trois voies :
   le CDC absorbe le plan (v2.1) ; le plan devient la référence et le CDC
   redevient un document de contexte ; ou un nouveau document est produit à
   partir des deux — la plus coûteuse, la plus propre.
3. **Les six branches `v0/group-xprience-*`** ne contiennent rien : elles
   pointent toutes sur le commit de `main`. Les supprimer.

**Recommandation** : fusionner `plan.md` dans `docs/`, produire une référence
unique qui reprend le CDC pour le fonctionnel et le plan pour l'économique et
le paiement, supprimer les six branches vides, et statuer séparément sur
`agent-skills/`.

Les six branches vides se suppriment ainsi — **action irréversible côté GitHub,
à ne lancer qu'après validation explicite** :

```powershell
git ls-remote --heads origin "v0/group-xprience-*"
```

Lire la sortie, vérifier que les six commits affichés sont bien identiques à
celui de `main`, **puis seulement** :

```powershell
git push origin --delete v0/group-xprience-39c2aa19 v0/group-xprience-51d2e561 v0/group-xprience-6a659ff9 v0/group-xprience-7069497f v0/group-xprience-8a0b5719 v0/group-xprience-b8b1ad66
```

### D-01 · Positionnement face à PUOL — **bloquant**

**Le fait** : une application concurrente en service, nommée PUOL, couvre déjà
le marché visé (chambres meublées à Douala, prix en FCFA, interface française,
annonces vérifiées, réservation avec avance, favoris, messagerie, parrainage).
Constat détaillé et preuves : `veille-concurrence.md`. Le CDC §2 affirme
l'inverse.

**Ce qu'il faut trancher** : quel est le différenciateur défendable ?

| Option | Ce que ça implique |
|---|---|
| **A — L'assistant IA comme produit** | On assume que PUOL existe, et on parie sur la recherche conversationnelle en français/langues locales comme porte d'entrée. Conséquence : l'agent IA passe du Sprint 5 au Sprint 2, il devient le cœur, pas un accessoire. |
| **B — Le segment** | On ne vise pas le même utilisateur (moyenne durée, expatriés, entreprises, étudiants...). Conséquence : la recherche, les filtres et la tarification changent — au minimum un tarif mensuel, pas seulement par nuit. |
| **C — Le web d'abord** | PUOL est une app mobile. Une plateforme web indexable capte la recherche Google, ce qu'une app ne fait pas. Conséquence : le référencement devient une exigence de premier rang (SSR, pages publiques par quartier). |
| **D — Renoncer ou pivoter** | Décision légitime si l'étude montre que PUOL a déjà l'offre et la demande. |

**Nécessaire avant de trancher** : établir le volume réel d'annonces de PUOL,
sa couverture géographique et son ancienneté. Aucune de ces données n'est
observable sur les captures disponibles.

> **Une réponse existe déjà, mais elle a été écrite avant le constat.**
> `plan.md` (§4.1) tranche pour l'équivalent de l'option A : *« l'expérience
> conversationnelle EST le produit »*, la navigation par grille et filtres
> restant un canal secondaire. Ce choix reste pertinent — il l'est même
> davantage face à un concurrent qui, lui, mise sur un fil vidéo. Mais il a été
> posé le 9 juillet, sur la prémisse « aucun concurrent local », que les
> captures du 17 juillet ont invalidée. **Le choix se re-justifie, il ne se
> reprend pas tel quel.**

### D-02 · Direction visuelle — **bloquant pour le Sprint 3**

`InspirationsMaquettes/` contient **trois** directions incompatibles :

1. **Airbnb officiel** (`Airbnb*.png`, plus tout `fluxdereservation/`) — blanc,
   dense, cartes, rouge Airbnb.
2. **Concept Figma orange** (`maquette*.png`) — « Airbnb Inspired Mobile App by
   Vinay », mobile, orange saturé, coins très arrondis.
3. **Concept éditorial sombre** (`maquettedesktop1.png`) — « Awe-inspiring
   Locations to Lodge », photo plein écran, sérif fin, quasi noir et blanc.

S'y ajoute une quatrième référence de fait : **PUOL**, vert, mobile, fil
vertical façon réseau social.

Tant qu'une seule direction n'est pas choisie et écrite, chaque écran sera
arbitré à la volée et le produit n'aura pas d'unité. Le choix doit tenir compte
d'une contrainte du CDC §9 : 80 % des utilisateurs sur mobile, en 3G.

`plan.md` (§1.3, F2) recommande de trancher pour une **identité propre
orange/terracotta, mobile-first**, cohérente avec les 80 % d'usage mobile du
CDC §9. C'est une réponse défendable, mais elle a été écrite sans connaître
PUOL — or PUOL est vert, ce qui rend le choix de l'orange plus distinctif
qu'il ne l'était sur le papier. À confirmer, pas à hériter.

**À produire une fois tranché** : un document de système de design (couleurs,
typographie, espacements, composants), avant le premier écran.

### D-03 · Architecture et structure du dépôt — **bloquant pour le Sprint 1**

**La vraie question n'est pas l'outillage, c'est le nombre de briques.** Le CDC
et `plan.md` ne sont pas d'accord.

| | **CDC v2.0 §6** | **`plan.md` §4.4** |
|---|---|---|
| Architecture | Next.js **et** NestJS, séparés | Monolithe Next.js full-stack |
| Base et ORM | PostgreSQL + Prisma | Neon + Drizzle |
| Auth | JWT + bcrypt + OTP SMS | Better Auth, OTP repoussé |
| Hébergement | Railway ou Render | Vercel |
| Argument | Séparation des responsabilités, agent IA comme service backend | 1 codebase, 1 déploiement, pas de CORS, mise sur le marché ~2× plus rapide |

L'argument de `plan.md` est solide sur le fond : deux déploiements, deux
codebases, du CORS et une double couche d'authentification pour une cible de
50 à 100 sessions simultanées, c'est du découplage acheté avant d'en avoir
besoin. Il faut cependant peser deux choses qu'il ne mentionne pas :

- Le CDC fait de la séparation un choix **argumenté** (§5.3, §6.3), pas un
  réflexe. Le renverser demande de le renverser explicitement, pas par omission.
- Le CDC est peut-être un document scolaire ou contractuel. Si sa stack est
  imposée par un tiers — jury, client, financeur — l'argument technique ne
  suffit pas. **Cette information me manque, et elle change la réponse.**

**Si la stack du CDC n'est pas imposée** : monolithe Next.js, comme le propose
`plan.md`. Le gain de temps est réel et la migration vers un backend séparé
reste possible plus tard.
**Si elle est imposée** : monodépôt `pnpm workspaces` avec `apps/web`,
`apps/api` et `packages/shared`, pour au moins partager les types entre le
contrat d'API et le front — c'est ce qui évite les régressions silencieuses.
`pnpm` 10.33.0 est déjà installé sur le poste.

À décider dans les deux cas : version de Node à épingler (le poste est en
v24.14.1 ; NestJS 10 a été validé sur des versions antérieures — voir
`etat-des-lieux.md` §2.3).

### D-04 · Périmètre de la v1.0 et durée réelle

Le CDC §11.1 annonce 6 sprints de 2 semaines pour un périmètre qui inclut
authentification multi-rôles, CRUD avec upload, interface publique, réservation
complète, agent IA avec function calling, tests unitaires, tests d'intégration,
**tests de charge**, déploiement, documentation Swagger et deux guides
utilisateurs. Le sprint 6 concentre tests, corrections et mise en production.

Deux points à trancher :

1. **La messagerie locataire–propriétaire est-elle dans la v1.0 ?** Le CDC §4 la
   liste comme capacité du locataire, mais le §7 ne prévoit aucune entité pour
   la porter. Si elle est dedans, il faut la modéliser ; si elle est dehors, il
   faut la retirer du §4.
2. **6 sprints ou 8 ?** Recommandation : 8, ou périmètre réduit. Un sprint de
   tests et de mise en production qui déborde, c'est une mise en production qui
   se fait sans les tests.

`plan.md` §4.2 propose un MVP délimité au couteau — dedans : catalogue,
recherche, assistant IA, réservation, **paiement acompte Mobile Money**, espace
propriétaire, admin réduit à 4 écrans, auth email/mot de passe. Dehors, et
nommément refusés : avis, OTP SMS, notifications WhatsApp, assistant vocal, app
native, **messagerie interne**, multi-langue, géolocalisation, multi-agences.

Ce périmètre répond au point 1 ci-dessus (la messagerie sort du MVP), mais il
**ajoute** le paiement — que le CDC repoussait à 6 mois. Le raisonnement de
`plan.md` : sans paiement, pas de revenu, donc aucune validation du modèle
économique ; et sans encaissement, rien n'empêche locataire et propriétaire de
traiter hors plateforme. L'argument tient. Il faut cependant mesurer ce que
coûte réellement l'entrée du paiement dans un premier jet : intégration
d'agrégateur, webhooks, réconciliation, gestion des échecs, reversements — et
un volet juridique qui n'existe nulle part aujourd'hui (D-05).

### D-05 · Coûts, fournisseurs et cadre juridique — à traiter avant le Sprint 5

Le CDC ne contient aucun montant. `plan.md` §5 et §6 comblent en grande partie
ce vide — mais ses chiffres n'ont pas été vérifiés, ni par son auteur, ni par
cet audit.

| Sujet | Où ça en est | Ce qu'il reste à faire |
|---|---|---|
| Modèle de revenus | `plan.md` §5.1 : commission 10 % + frais service 3 % plafonnés à 5 000 FCFA + annonces premium | Valider les taux face à la concurrence locale réelle |
| Point mort | `plan.md` §5.3 : mois 7-9, sur un panier moyen de 88 000 FCFA (22 000 × 4 nuits) | **Sourcer le prix moyen.** Le seul prix réel observé dans le dépôt est une annonce PUOL à 16 500 FCFA/nuit, 25 % sous l'hypothèse |
| Coûts d'exploitation | `plan.md` §5.3 : 25-45 k FCFA hébergement, 30-100 k FCFA OpenAI pour ~1 500 conversations | Vérifier le coût par conversation sur un prototype réel avant d'ouvrir le chatbot |
| Agrégateur de paiement | `plan.md` §6.2 : NotchPay recommandé, CinetPay en repli, Flutterwave en complément | **Non vérifié par cet audit** — existence, tarifs, conditions d'accès, délai réel d'intégration |
| Fournisseur SMS | Aucun nommé, ni au CDC ni dans `plan.md`. `plan.md` propose de repousser l'OTP en v1.1 | Trancher : OTP au MVP ou non |
| Hébergement | CDC : Railway ou Render. `plan.md` : Vercel | Découle de D-03 |
| Juridique | **Rien, nulle part** | Conditions générales, données personnelles, statut des fonds encaissés, politique d'annulation |

Le point juridique devient nettement plus lourd si le paiement entre dans le
MVP comme le propose `plan.md` : encaisser pour le compte de tiers n'est pas
une fonctionnalité, c'est une activité. PUOL affiche déjà une politique de
paiement et de remboursement écrite — c'est le minimum opérationnel.
