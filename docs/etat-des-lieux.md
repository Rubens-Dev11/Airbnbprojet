# État des lieux — document de reprise

**Date de l'audit** : 7 août 2026
**Périmètre** : totalité du dépôt `Airbnbprojet`, branche `main`, commit
`2961ef0`, plus les fichiers non versionnés.
**Méthode** : lecture directe du dépôt et exécution de commandes. Chaque
constat ci-dessous est accompagné de sa preuve. Ce qui n'a pas pu être vérifié
est signalé comme tel.

---

## 1. Synthèse en dix lignes

Le projet est **en phase de cadrage documentaire**, pas en développement,
malgré la mention « Statut : en cours de développement » page 2 du cahier des
charges. Le dépôt contient un cahier des charges solide (17 pages, 11 sections)
et 67 images de référence. Il ne contient **aucun code applicatif, aucun
`package.json`, aucun schéma de base de données**. Sur les 6 sprints planifiés
au CDC §11.1, **0 est entamé**.

Quatre problèmes de fond, par ordre de gravité :

1. **Un plan stratégique complet de 242 lignes existe sur une branche distante
   jamais fusionnée**, invisible depuis le poste de travail. Il contredit le CDC
   sur l'architecture, le modèle économique et le calendrier de paiement. Deux
   documents de référence coexistent donc sans que l'un ait autorité sur
   l'autre. Voir §5.
2. Le CDC affirme qu'aucune plateforme spécialisée n'existe pour Douala. **Des
   captures d'une plateforme concurrente en service, ciblant exactement le même
   marché, dorment non versionnées dans le dépôt depuis le 17 juillet.** Le
   CDC n'a pas été mis à jour.
3. Le modèle de données du CDC §7 ne permet pas de tenir deux exigences du CDC
   §9 (blocage automatique des dates, disponibilité temps réel) ni une capacité
   du §4 (messagerie locataire–propriétaire).
4. Le dépôt n'avait aucun garde-fou de versionnement à la veille d'introduire
   une stack qui manipule des clés API. Corrigé dans cette session.

---

## 2. Inventaire vérifié

### 2.1 Versionnement

| Élément | Valeur constatée | Preuve |
|---|---|---|
| Branche locale | `main`, et elle seule | `git branch -vv` |
| Commits sur `main` | 2 | `git log --oneline` |
| Historique | `8e7e48f first commit` (2026-07-09 07:55), `2961ef0 documentations` (2026-07-09 08:02) | `git log --format="%h %ad %s" --date=iso` |
| Remote | `origin` → `https://github.com/Rubens-Dev11/Airbnbprojet.git` | `git remote -v` |
| **Commits locaux non poussés** | **Aucun.** `main` et `origin/main` sont sur `2961ef0`, écart 0/0 | `git rev-list --left-right --count origin/main...HEAD` → `0  0` |
| Modifications en attente | Aucune non commitée à l'ouverture de l'audit, hors les 27 fichiers non suivis | `git status --porcelain` |
| Remises (`stash`) | Aucune | `git stash list` |
| **Branches sur le remote** | **8**, dont 7 que le poste ignorait | `git ls-remote origin` — interrogation du remote réel, pas du cache local |
| **Commits distants absents de `main`** | **2**, sur `check-github-repo-airbnbprojet` — voir §5 | `git log main..origin/check-github-repo-airbnbprojet` |
| Fichiers suivis sur `main` | 43 | `git ls-files \| wc -l` |
| Fichiers non suivis | 27 | `git status --porcelain` |
| Taille de `.git` | 12,76 Mo (avant récupération des branches distantes) | somme des tailles récursives |

> **Méthode.** La synchronisation a été contrôlée en interrogeant le remote
> lui-même (`git ls-remote`), pas la référence locale `origin/main`. Cette
> dernière est un cache : elle peut être périmée et affirmer une synchronisation
> qui n'existe pas. C'est exactement ce qui s'est produit ici — le cache local
> ne connaissait qu'une branche sur huit.

### 2.2 Contenu du dépôt

| Chemin | Nombre de fichiers | Nature | Statut git |
|---|---|---|---|
| `CDC_Plateforme_Douala_v2.pdf` | 1 | Cahier des charges v2.0, 17 pages | suivi |
| `fluxdereservation/` | 23 PNG | Captures de l'app **Airbnb officielle** en français (parcours accueil → recherche → filtres → détail logement → login → paiement, plus vues carte) | suivi |
| `InspirationsMaquettes/` | 10 PNG + 27 JPEG | Trois sources hétérogènes, voir §3.1 | 10 suivis, **27 non suivis** |
| `infoAirbnbPlaystore/` | 1 TXT + 7 JPEG | Texte de la fiche Play Store d'Airbnb (25 lignes, UTF-8, CRLF) + captures | suivi |
| `README.md` | 1 | 34 octets avant cette session | suivi |
| **Code applicatif** | **0** | — | — |

Preuve du « 0 code » : listing récursif complet du dépôt hors `.git`. Aucun
fichier `.ts`, `.tsx`, `.js`, `.json`, `.prisma`, `.sql`, `Dockerfile`,
`package.json`. Aucun dossier `src/`, `apps/`, `packages/`, `prisma/`.

### 2.3 Poste de développement

Vérifié le 7 août 2026 par exécution directe :

| Outil | Version constatée |
|---|---|
| Node.js | v24.14.1 |
| npm | 11.11.0 |
| pnpm | 10.33.0 |
| Docker | 29.4.3 |
| `psql` | **absent du PATH** |
| `pdftotext` | présent (fourni par Git for Windows) |

> **Point d'attention non bloquant.** Le CDC §6.2 vise Node.js pour NestJS
> v10.x. Node 24 est une version majeure nettement plus récente que celle sur
> laquelle NestJS 10 a été validé. Ce n'est pas une erreur, mais la version de
> Node doit être **épinglée** (`.nvmrc` + champ `engines`) au moment du
> squelette, sinon le comportement diffèrera entre le poste et
> l'hébergement. Non vérifié : la compatibilité effective NestJS 10 / Node 24 —
> elle ne pourra l'être qu'à l'installation.

---

## 3. Constats — dépôt et organisation

### C-01 · 27 fichiers non versionnés depuis trois semaines — **critique**

`git status --porcelain` liste 27 JPEG `WhatsApp Image 2026-07-17 at 04.56.xx`
dans `InspirationsMaquettes/`, tous non suivis. Ils ne sont donc **ni
sauvegardés, ni partagés, ni sur GitHub**. Sur un poste unique, une panne
disque les fait disparaître. Leur contenu (voir §4) en fait le matériau le plus
stratégique du dépôt à ce jour.

**Action** : les committer **tels quels**, avant toute réorganisation.

### C-02 · `README.md` versionné en UTF-16, traité comme un binaire par git — **corrigé**

Constat : les 8 premiers octets du fichier versionné étaient
`FF FE 23 00 20 00 41 00` — BOM UTF-16 LE suivi de `# A` en UTF-16. Le
`git log --stat` du commit initial affiche `README.md | Bin 0 -> 34 bytes`, et
`git grep -I -e "" -- README.md` ne retourne rien : git le classait bien comme
binaire. Conséquence : aucun diff lisible, aucune revue possible, rendu
incertain selon les outils.

**Corrigé dans cette session** : fichier supprimé puis recréé en UTF-8
(2627 octets, 0 octet NUL, premiers octets `23 20 50 6C`). Voir `journal.md`
pour l'incident d'encodage rencontré au passage.

### C-03 · Aucun `.gitignore` — **corrigé**

Le dépôt n'avait aucun `.gitignore`. La stack prévue impose de manipuler une
clé API OpenAI, des identifiants Cloudinary, un secret JWT et une URL
PostgreSQL. Sans garde-fou, le premier `git add .` publie le `.env`. Un secret
publié ne se dépublie pas : il faut le révoquer.

**Corrigé** : `.gitignore` créé, secrets en tête de fichier.
`prisma/migrations/` est délibérément **exclu de l'exclusion** — une migration
non versionnée rend toute base reconstruite incomplète.

### C-04 · `core.autocrlf = true` sans `.gitattributes` — **corrigé**

`git config --get core.autocrlf` retourne `true`. Sans `.gitattributes`, chaque
poste décide seul du format stocké, et le fichier versionné cesse de
correspondre octet pour octet à ce qui est déployé.

**Corrigé** : `.gitattributes` créé (`* text=auto eol=lf`, exceptions Windows,
binaires marqués).

### C-05 · Dossiers de référence sans convention — **non corrigé, décision requise**

Trois dossiers racine (`fluxdereservation`, `InspirationsMaquettes`,
`infoAirbnbPlaystore`) mélangent trois conventions de nommage (tout attaché,
CamelCase, casse mixte) et, pour l'un d'eux, trois sources de nature différente.
27 fichiers portent un nom horodaté WhatsApp qui ne dit rien de leur contenu.

Non corrigé volontairement : réorganiser avant d'avoir committé les 27 fichiers
non suivis produirait un diff illisible. Arborescence cible et commandes :
`structure-cible.md`.

### C-06 · Aucune règle de travail dans le dépôt — **corrigé**

Les règles de méthode existaient hors du dépôt. Elles sont désormais dans
`docs/regles-de-travail.md`, donc opposables et versionnées.

### C-07 · Sept branches distantes inconnues du poste de travail — **décision requise**

Le dépôt local ne connaissait que `main`. L'interrogation du remote en révèle
**huit** :

| Branche distante | Commit | Écart avec `main` |
|---|---|---|
| `main` | `2961ef0` | référence |
| `check-github-repo-airbnbprojet` | `e60b0f4` | **2 commits, 22 fichiers, +1236 lignes** — voir §5 |
| `v0/group-xprience-39c2aa19` | `2961ef0` | aucun |
| `v0/group-xprience-51d2e561` | `2961ef0` | aucun |
| `v0/group-xprience-6a659ff9` | `2961ef0` | aucun |
| `v0/group-xprience-7069497f` | `2961ef0` | aucun |
| `v0/group-xprience-8a0b5719` | `2961ef0` | aucun |
| `v0/group-xprience-b8b1ad66` | `2961ef0` | aucun |

Les six branches `v0/group-xprience-*` pointent **toutes** sur le même commit
que `main`. Elles ne contiennent aucun travail : ce sont des branches de session
créées par un outil, jamais nettoyées. Elles encombrent la vue des branches et
font croire à une activité qui n'existe pas.

`check-github-repo-airbnbprojet`, en revanche, porte du travail réel jamais
fusionné, et personne ne le voyait depuis le poste.

**Action** : supprimer les six branches vides, statuer sur la septième (§5).

### C-08 · Le cahier des charges a été commité comme du texte — **vérifié sans dommage**

`git log --stat` du premier commit affiche `CDC_Plateforme_Douala_v2.pdf | 385
+++++` : git a classé le PDF en **texte**, pas en binaire, parce qu'il ne
contient pas d'octet NUL dans ses premiers milliers d'octets. Combiné à
`core.autocrlf = true`, cela ouvrait la possibilité d'une conversion de fins de
ligne à l'intérieur du fichier — donc d'un cahier des charges illisible pour
quiconque clone le dépôt, sans que rien ne le signale localement.

**Contrôlé** : le blob de `HEAD` extrait octet pour octet et le fichier de
travail ont la même empreinte SHA-256
(`414fdea5ff7951bb66c3a5cf802a2fd220807fe357a193e1231d682c8314a9b8`), et
`pdftotext` s'exécute avec succès sur le blob extrait. **Le document versionné
est intact.**

Le `.gitattributes` créé dans cette session marque `*.pdf` comme binaire, ce qui
ferme définitivement la question.

---

## 4. Constat majeur — un concurrent en service sur le marché cible

Les 27 captures non versionnées du 17 juillet 2026 ne sont pas des maquettes.
Ce sont des **captures d'écran d'une application mobile en fonctionnement**,
prise sur un téléphone Android réel (horloge 03:32–03:43, réseau 4G, batterie
69–73 %), d'un produit nommé **PUOL**, en français, opérant sur des logements à
Douala.

Constaté directement à l'écran sur un échantillon de 5 captures :

- Fil vertical plein écran type TikTok, onglets « Explorer » / « Pour toi »,
  avec vidéos de logements et compteurs de likes/commentaires/partages.
- Annonce réelle : « Chambre meublé », « Carrefour Andem », badges
  « Chambre / Meublé / 2 personnes », **« 16 500 FCFA (≈ 25 €) / NUIT »**,
  bouton « DÉCOUVRIR L'OFFRE ».
- Fiche détaillée : quartier « Bepanda Tapis Rouge », « Proximité de la route :
  En bord de route », mention **« Cette Annonce a été vérifiée et est
  disponible »**, offre « 7 nuits réservées → 10 % de remise », note explicite
  sur la langue de la description contre celle de l'interface.
- **Politique de paiement et de remboursement** : avance en ligne pour
  confirmer et bloquer les dates, solde réglé à l'hôte à l'arrivée, avance
  explicitement **non remboursable**, avec écran d'acceptation.
- Navigation : Accueil / Visites / (+) / Favoris / Profil. Écran profil avec
  publications, followers, vues, likes, commentaires, réservations, avis, et un
  programme **« Ambassadeur PUOL — code promo, wallet et parrainages »**.

### Ce que cela invalide dans le cahier des charges

Le CDC §2, encadré « Opportunité identifiée », affirme :

> Aucune plateforme spécialisée n'existe pour Douala avec : paiement Mobile
> Money, interface en français, assistant IA en langue locale, et adaptation
> aux réalités camerounaises.

Cette phrase est **factuellement contredite** par du matériel présent dans le
dépôt. PUOL couvre déjà : interface en français, prix en FCFA, quartiers de
Douala, annonces vérifiées, réservation avec avance, favoris, messagerie,
parrainage. Le CDC est daté v2.0 et son fichier PDF date du 12 mai 2026 ; les
captures datent du 17 juillet 2026 — soit **deux mois plus tard**, sans mise à
jour du CDC.

Non vérifié, et à établir avant tout engagement de développement : le volume
d'annonces réel de PUOL, sa couverture géographique, son ancienneté, son
financement, et s'il propose ou non Mobile Money et un assistant IA. Ces points
n'apparaissent sur aucune des captures consultées.

### Ce que cela ne remet pas en cause

L'existence d'un concurrent ne tue pas le projet — elle **valide le marché** :
quelqu'un a jugé le besoin assez réel pour construire, publier et exploiter un
produit dessus. Ce qu'elle tue, c'est le positionnement « premier sur un marché
vide ». Il faut un différenciateur explicite, arbitré et écrit. Voir
`decisions.md` (D-01) et `veille-concurrence.md`.

---

## 5. Travail antérieur non fusionné — branche `check-github-repo-airbnbprojet`

**Découvert le 7 août 2026, en cours d'audit**, en interrogeant le remote. Ce
travail n'était visible ni depuis le poste, ni dans `main`, ni dans aucun
document du dépôt.

### 5.1 Ce que contient la branche

| Fait | Valeur constatée |
|---|---|
| Commits | 2, tous deux du 2026-07-09 (15:13 et 15:31 UTC) |
| Auteur | `v0 <it+v0agent@vercel.com>` — agent automatique Vercel v0 |
| Apport | 22 fichiers, +1236 lignes |
| Base | branchée sur `2961ef0`, donc sur l'état actuel de `main` |
| Fusion | **jamais fusionnée**, jamais référencée nulle part |

Contenu :

- **`plan.md`** (242 lignes) — plan stratégique complet : audit de l'existant,
  optimisation du CDC, vision produit, définition du MVP, roadmap en 6 sprints,
  décision d'architecture, **modèle économique chiffré**, **intégration des
  paiements Mobile Money**, mécanique anti-désintermédiation, indicateurs de
  pilotage.
- **`agent-skills/`** (21 fichiers) — description d'un système multi-agents
  (CEO, Strategy, Product, CTO, PM, Dev, Memory) et de 20 « skills » répartis
  en 6 modules : stratégie, produit, technique, exécution, documentation,
  mémoire. C'est de la documentation de méthode, pas du code exécutable.

### 5.2 Ce que ce plan apporte, et que le CDC n'a pas

Ces sept points sont absents du cahier des charges. Ils sont exploitables tels
quels et ne demandent qu'à être arbitrés.

1. **Modèle économique chiffré** : commission de 10 % sur le séjour, frais de
   service locataire de 3 % plafonnés à 5 000 FCFA, annonces premium, abonnement
   propriétaire. Le CDC ne contient aucun montant (CDC-05).
2. **Mécanique anti-désintermédiation** : masquer le téléphone et l'adresse du
   propriétaire jusqu'au paiement de l'acompte. Sans cela, la plateforme sert
   d'annuaire et ne perçoit rien. Le CDC n'en dit pas un mot.
3. **Amorçage de l'offre** : recruter et saisir manuellement 30 à 50 logements
   avant l'ouverture publique. Une place de marché vide ne démarre pas.
4. **Paiement dans le MVP** via un agrégateur, acompte de 30 % en ligne et solde
   à l'arrivée — au lieu du report à 6 mois prévu par le CDC.
5. **Machine à états de la réservation** : expiration automatique de la demande
   sous 24 h, et blocage des dates par **contrainte d'exclusion PostgreSQL**, pas
   seulement applicative. C'est la réponse correcte à la lacune CDC-02.
6. **Objectifs mesurables** en remplacement de formulations vagues : « responsive
   mobile-first » devient LCP < 2,5 s en 3G, images ≤ 100 Ko, bundle < 200 Ko.
7. **Indicateurs de pilotage**, dont la part de réservations initiées via l'agent
   IA — le seul indicateur qui dira si le différenciateur en est réellement un.

### 5.3 Ce sur quoi ce plan contredit le CDC

| Sujet | CDC v2.0 | `plan.md` |
|---|---|---|
| Architecture | Next.js **et** NestJS séparés | Monolithe Next.js full-stack (Route Handlers, Server Actions) |
| ORM et base | Prisma + PostgreSQL auto-hébergé | Drizzle + Neon (PostgreSQL serverless) |
| Authentification | JWT + bcrypt **+ OTP SMS** | Better Auth, email/mot de passe, OTP repoussé en v1.1 |
| Agent IA | Sprint 5, canal secondaire | Canal de réservation **principal**, cœur du produit |
| Paiement | v2.0, horizon 6 mois | **Dans le MVP**, sprint 6 |
| Hébergement | Railway ou Render | Vercel |
| Rôles | ENUM incluant `VISITEUR` | Rôle unique par utilisateur, `LOCATAIRE` par défaut |

Ces divergences ne sont pas des détails d'implémentation : elles changent le
produit, le calendrier et la structure du dépôt. **Deux documents de référence
coexistent aujourd'hui sans qu'aucun n'ait autorité sur l'autre.** C'est la
situation qui produit, quelques mois plus tard, du code qui ne correspond à
aucun des deux.

### 5.4 Les limites de ce plan

Signalées ici pour qu'il soit repris en connaissance de cause, pas pour le
disqualifier.

- **Sa prémisse marché est aujourd'hui fausse.** Le §1.2 affirme « Opportunité
  marché validée : aucun concurrent local avec Mobile Money + français + IA ».
  C'est la reprise du CDC §2, sans vérification indépendante. Les captures PUOL
  (§4) la contredisent. **En toute équité : le plan date du 9 juillet, les
  captures du 17 juillet.** Le plan n'avait pas cette information ; il ne l'a
  simplement jamais reçue depuis.
- **Le prix moyen retenu n'est pas sourcé.** Le §5.3 pose 22 000 FCFA la nuit et
  4 nuits de séjour moyen. Le seul prix réel observable dans le dépôt est celui
  d'une annonce PUOL : **16 500 FCFA la nuit**, soit 25 % sous l'hypothèse. Un
  point de mesure ne fait pas un marché, mais il suffit à imposer une
  vérification avant de bâtir un point mort dessus.
- **Le choix d'agrégateur de paiement n'a pas été vérifié.** `plan.md` recommande
  NotchPay, avec CinetPay en repli et une intégration estimée à 3-5 jours. **Je
  n'ai vérifié ni l'existence, ni les tarifs, ni les conditions d'accès de ces
  prestataires** : aucun accès externe n'a été utilisé pendant cet audit. À
  confirmer avant toute décision.
- **Il n'a pas vu le défaut d'encodage du `README.md`**, qu'il décrit comme
  « vide (titre seul) » là où le fichier était traité comme un binaire par git
  (C-02). Détail, mais il montre que l'audit qu'il contient est resté en surface
  sur la partie dépôt.
- **Il ne mentionne aucun volet juridique** : conditions générales, données
  personnelles, statut des fonds encaissés. Même lacune que le CDC (CDC-06), et
  elle devient plus lourde dès lors qu'on encaisse dans le MVP.

### 5.5 Recommandation

Ne pas laisser ce travail sur une branche. Deux options, arbitrage D-06 dans
`decisions.md` :

- **Fusionner puis corriger** — récupérer `plan.md` et `agent-skills/` dans
  `main`, puis publier un document de référence unique qui tranche entre le CDC
  et le plan, point par point.
- **Extraire puis supprimer** — ne reprendre que `plan.md`, l'intégrer à `docs/`,
  et abandonner `agent-skills/` s'il ne décrit pas la méthode de travail
  réellement suivie.

Dans les deux cas, la branche ne doit pas rester en l'état : du travail
stratégique invisible depuis le poste de travail finit par être refait.

---

## 6. Constats sur le cahier des charges

Le CDC est de bonne qualité : structuré, argumenté, avec des choix techniques
justifiés (le refus de n8n comme cerveau de l'agent IA, le refus de Vapi au
stade MVP). Les points ci-dessous sont des manques à combler, pas une remise en
cause du document.

### CDC-01 · Le rôle VISITEUR est modélisé comme une valeur d'énumération — **contradiction interne**

§4 définit « Visiteur (non connecté) » comme un rôle. §7 fait de `VISITEUR` une
valeur possible de `User.role`. Or un utilisateur non connecté n'a par
définition **aucune ligne** dans la table `User`. Conserver `VISITEUR` dans
l'énumération produira des états impossibles en base et des règles d'accès
ambiguës.
**Correctif recommandé** : `role ENUM(LOCATAIRE, PROPRIETAIRE, ADMIN)`. Le
visiteur est l'absence de session, pas un rôle stocké.

### CDC-02 · Le modèle ne permet pas le blocage des dates — **lacune bloquante**

§9 exige « Un logement accepté bloque automatiquement les dates » et §5.2 étape
1 exige « Vérifie disponibilité en temps réel ». Or `Property` ne porte qu'un
`disponible BOOLEAN`. Un booléen ne représente pas un calendrier : il ne permet
ni de savoir qu'un logement est pris du 12 au 15 mais libre le 16, ni de
détecter un chevauchement entre deux demandes concurrentes.
**Correctif recommandé** : une entité de disponibilité par plage de dates, plus
une contrainte d'exclusion en base sur les intervalles (PostgreSQL sait le
faire nativement) — c'est ce qui empêche la double réservation lors de deux
requêtes simultanées, cas explicitement visé par les objectifs de charge du §8.3.

### CDC-03 · La messagerie n'a aucun modèle de données — **lacune**

§4 attribue au locataire « Communiquer avec le propriétaire via la plateforme »
et §5.2 étape 2 prévoit « Notifie le propriétaire ». §7 ne décrit que cinq
entités, dont aucune n'est un message. `Booking.message TEXT` ne couvre qu'un
message unique attaché à la demande, pas une conversation.
**Décision requise** : messagerie dans le MVP (alors il faut une entité et des
règles), ou hors MVP (alors la retirer du §4 pour la v1.0).

### CDC-04 · L'OTP SMS est exigé sans fournisseur choisi — **lacune**

§8.1 impose la « Vérification du compte par OTP SMS sur numéro camerounais ».
Aucune section ne nomme de fournisseur SMS, ne chiffre le coût par message, ni
ne traite le cas d'échec de délivrance. C'est un point de blocage classique au
Cameroun (routes SMS internationales peu fiables, coûts variables).

### CDC-05 · Aucune ligne de budget dans tout le document — **lacune, niveau direction**

Le CDC décrit une plateforme dont l'usage courant consomme des services
facturés à l'appel : OpenAI GPT-4o sur chaque conversation, Cloudinary sur
chaque image, SMS sur chaque inscription, hébergement Railway/Render. Les 17
pages ne comportent **aucun** montant, aucune estimation de coût par
utilisateur, aucun plafond. Une cible de « 50 à 100 sessions actives » (§8.3)
sans coût unitaire connu n'est pas un objectif pilotable.
**Action** : établir un coût par conversation et par annonce avant le Sprint 5.

### CDC-06 · Aucun volet juridique — **lacune, niveau direction**

Le produit encaisse de l'argent pour le compte de tiers et stocke des données
personnelles (téléphone, photo de profil, historique de conversation). Le CDC ne
traite ni les conditions générales, ni la protection des données, ni le statut
des fonds encaissés, ni la politique d'annulation. Le concurrent PUOL, lui, a
un écran de politique de paiement et de remboursement — c'est le minimum
opérationnel.

### CDC-07 · Le périmètre du MVP tient mal dans les six sprints annoncés — **risque de planning**

§11.1 annonce 6 sprints de 2 semaines, soit 12 semaines, pour couvrir :
authentification multi-rôles, CRUD logements avec upload, interface publique
avec recherche et filtres, système de réservation complet, agent IA avec
function calling, **plus** tests unitaires, tests d'intégration, tests de
charge, déploiement, documentation Swagger et deux guides utilisateurs
(§11.2). Le sprint 6 concentre à lui seul tests, corrections et mise en
production. C'est le sprint qui déborde toujours.
**Recommandation** : soit réduire le périmètre v1.0, soit porter le planning à
8 sprints. Décision à arbitrer, elle n'est pas technique.

### CDC-08 · Mise en page des tableaux du PDF — **non vérifié**

L'extraction texte du PDF montre des décalages entre colonnes dans les tableaux
§2, §5.2, §6.1 et §7 (une description apparaissant en face de la mauvaise
ligne). **Je n'ai pas pu déterminer** s'il s'agit d'un défaut du document ou
d'un artefact de l'outil d'extraction : le rendu visuel du PDF n'a pas été
inspecté. À contrôler à l'œil avant de diffuser le CDC à un tiers.

---

## 7. Ce qui a été modifié dans cette session

| Fichier | Nature | Motif |
|---|---|---|
| `.gitignore` | créé | C-03 — protéger les secrets avant l'arrivée du code |
| `.gitattributes` | créé | C-04 — figer les fins de ligne en LF |
| `README.md` | réécrit | C-02 — sortir de l'UTF-16 traité comme binaire |
| `docs/README.md` | créé | Index de la documentation |
| `docs/regles-de-travail.md` | créé | C-06 — rendre la méthode opposable |
| `docs/etat-des-lieux.md` | créé | Ce document |
| `docs/decisions.md` | créé | Tracer les arbitrages, ouverts et arrêtés |
| `docs/roadmap.md` | créé | Découpage sprints + backlog + définition de terminé |
| `docs/fonctionnalites-critiques.md` | créé | Support de la non-régression (vide à ce stade) |
| `docs/veille-concurrence.md` | créé | Consigner le constat PUOL |
| `docs/structure-cible.md` | créé | Arborescence visée + commandes de reprise |
| `docs/journal.md` | créé | Journal des modifications |

Aucun fichier supprimé. Aucun fichier déplacé. Aucun commit, aucun push.

## 8. Ce qui reste à faire, dans l'ordre

1. Committer les 27 fichiers non suivis **tels quels** (C-01).
2. Committer les garde-fous et la documentation de cette session.
3. Statuer sur la branche `check-github-repo-airbnbprojet` (C-07, §5, D-06) et
   supprimer les six branches `v0/group-xprience-*` vides.
4. Trancher les arbitrages ouverts de `decisions.md`.
5. Publier **un seul** document de référence produit, qui tranche entre le CDC
   v2.0 et `plan.md` point par point, et corrige CDC-01 à CDC-07.
6. Seulement ensuite : squelette applicatif (Sprint 1).

## 9. Hypothèses prises, faute d'information

- **Nom du produit** : aucun nom commercial n'apparaît dans le CDC. `Airbnbprojet`
  est traité comme un nom de dépôt, pas comme un nom de produit.
- **Langue de la documentation** : français, aligné sur le CDC et sur la cible
  utilisateur. Non confirmé explicitement.
- **Gestionnaire de paquets** : `pnpm` est retenu par défaut dans les exemples
  car présent sur le poste et adapté à un monodépôt. Non arbitré — voir D-03.
- **Fuseau et dates** : les dates des captures PUOL proviennent des noms de
  fichiers WhatsApp (17 juillet 2026) et de l'horloge visible sur les captures
  (03:32–03:43). Le fuseau n'est pas certifiable.
