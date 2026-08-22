# Journal des modifications

Une entrée par tâche. Chaque entrée dit **pourquoi**, pas seulement quoi — le
quoi est dans le diff, le pourquoi disparaît avec la personne qui l'a écrit.
Chaque entrée dit aussi **ce qui a été vérifié, et comment**.

Format : entrée la plus récente en haut.

---

## 2026-08-07 — Le parcours complet fonctionne, et les photos sont enfin optimisées

**Constat du fondateur.** Annonce créée, deux photos téléversées, publiée,
visible sur l'accueil — **le parcours entier fonctionne en conditions
réelles**. Mais la carte publique n'affichait aucune image.

Cause simple : je n'avais jamais mis les photos dans la requête de la page
d'accueil. Le champ n'était pas sélectionné, donc rien à afficher. Oubli, pas
défaut.

### Un détour qui valait la peine

Les vignettes de l'administration utilisent `unoptimized` — acceptable en
interne. Côté public, non : le CDC §9 vise une connexion 3G et exige des images
optimisées. Plutôt que de recopier `unoptimized`, `next.config.ts` déclare
maintenant le domaine Supabase — **déduit de la configuration, jamais écrit en
dur**, puisqu'il diffère entre le poste et la production.

### Une protection de Next.js 16 que je ne connaissais pas

L'image restait cassée, avec un `400 Bad Request` muet côté navigateur. Le
journal du serveur, lui, était explicite :

> `hostname resolved to private IP ["127.0.0.1"] … you understand SSRF risk`

Next refuse d'aller chercher une image sur une IP privée : sans cela,
l'optimiseur devient une sonde vers le réseau interne du serveur. La garde ne
gêne **que** le développement local ; en production l'hôte Supabase est public.

Levée **uniquement si `NODE_ENV === 'development'`**. L'activer en production
ouvrirait une faille réelle — le nom du drapeau le dit assez fort.

À retenir : le navigateur affichait un 400 sans explication, le serveur donnait
la cause et le remède en une ligne. Lire le journal du serveur avant de
supposer.

### Gain mesuré, pas estimé

| | Type | Poids |
|---|---|---|
| Fichier d'origine (Supabase) | JPEG | 28 999 o |
| Optimisé, navigateur moderne | **AVIF** | **6 807 o** — −76 % |
| Optimisé, navigateur ancien | JPEG | 19 073 o — −34 % |

**Réserve** : cette photo fait 29 Ko. Sur de vraies photos de logement de 2 à
4 Mo, le ratio sera différent — à remesurer sur le catalogue réel avant d'en
tirer une conclusion sur la tenue en 3G.

### Vérifié

- Image affichée à l'écran, contrôlée par capture.
- Poids et type mesurés par requête directe, avec et sans `Accept: image/avif`.
- `pnpm check` exit 0 (20 tests de base). `next build` exit 0, 6 routes.

---

## 2026-08-07 — J'ai supprimé une annonce sous les pieds du fondateur

**Ce qui s'est passé.** Après avoir exercé le parcours de création dans le
navigateur, j'ai supprimé l'annonce d'essai de la base — au nom de la règle
« ne jamais laisser de données de démonstration ». Le fondateur avait **la même
page ouverte**. Son téléversement a échoué sur :

> `insert or update on table "listing_images" violates foreign key constraint
> "listing_images_listing_id_fkey"`

**Faute de conduite, pas de code.** J'ai modifié un état partagé sans regarder
ce qui l'utilisait, et sans prévenir. La règle sur les données de démonstration
reste juste ; c'est le moment et le silence qui étaient mauvais. À retenir :
avant de supprimer, vérifier qui regarde.

**Vérifié plutôt que supposé** : la base contenait bien **0 annonce**, et l'id
de l'URL du fondateur n'existait plus.

### Un garde-fou validé par accident

`storage.objects` ne contenait **aucun fichier orphelin**. Le repli écrit dans
`uploadListingPhotos` — retirer le fichier quand la ligne échoue — a donc
fonctionné en conditions réelles, sur un cas que je n'aurais pas su provoquer
volontairement. C'est la seule bonne nouvelle de l'incident.

### Deux corrections

**1. Le message était exact et inutilisable.** Un nom de contrainte n'aide
personne : il ne dit ni la cause, ni la suite. `explainRowError()` traduit
désormais le code `23503` en « cette annonce n'existe plus… revenez à la liste
et créez une nouvelle annonce », en conservant le message technique pour le
diagnostic.

**2. Échouer tôt plutôt que proprement.** L'existence de l'annonce est
maintenant contrôlée **avant** le premier téléversement. L'ancien
comportement — déposer puis retirer — était correct mais payait un aller-retour
réseau pour rien ; depuis le Cameroun c'est ~250 ms mesurés par requête
(ADR-004), multipliés par le nombre de fichiers.

### Vérifié

`pnpm typecheck` exit 0 sur les 3 paquets.

### Non vérifié

**Le nouveau garde-fou n'a pas été exercé.** Le déclencher demande une session
administrateur dans un navigateur ; mon onglet n'en a pas et je ne saisis pas
de mot de passe. Le chemin est simple et le typecheck passe — ce n'est pas une
preuve, et c'est dit comme tel.

---

## 2026-08-07 — Publication et photos : l'écran d'administration devient utilisable

**Déclencheur.** Le fondateur envoie une capture de l'écran d'administration
connecté. Il fonctionne — c'était le dernier maillon que je n'avais pas vu.
Mais le regarder a montré deux manques que la lecture du code n'avait pas
soulevés, et qui rendaient la Phase 0 impossible.

### Deux manques bloquants, de ma responsabilité

1. **Aucun moyen de publier une annonce.** Elle naît en brouillon (choix
   délibéré) et rien dans l'interface ne la met en ligne. On pouvait saisir
   vingt annonces et n'en montrer aucune.
2. **Aucun téléversement de photos.** Or le CDC §1 identifie « photos
   inexistantes ou trompeuses » comme un problème central du marché de Douala.
   Une annonce sans photo ne convertit pas — construire le catalogue sans
   photos aurait produit 30 fiches inutiles.

Les deux passaient le typecheck, le build et les 20 tests. Rien ne pouvait les
détecter : ce ne sont pas des défauts, ce sont des **absences**. Seul un
regard sur l'écran, avec l'usage réel en tête, les fait apparaître.

### Ce qui a été ajouté

- `0006_storage_listing_photos.sql` — compartiment `listing-photos`, **public
  en lecture**. Une photo est une donnée publique au même titre que le prix ;
  la protéger empêcherait le référencement, seul canal d'acquisition gratuit
  face à PUOL. Les coordonnées, elles, restent dans `listing_contacts`.
  Écriture réservée aux administrateurs. Limite à 5 Mo : accepter 20 Mo
  garantirait des fiches inutilisables sur le marché 3G visé.
- Action de publication, **avec un refus** : une annonce sans photo ne peut pas
  être publiée. La règle vaut mieux qu'un rappel dans une documentation que
  personne ne relit.
- Téléversement multiple, suppression, et page de détail par annonce.

### Deux choix de conduite d'erreur

- Le contrôle de type et de taille est **refait dans l'action** alors que le
  compartiment les impose déjà : une erreur du service de stockage arrive sans
  contexte, un refus applicatif nomme le fichier fautif. L'un protège, l'autre
  explique.
- Si le fichier est déposé mais que la ligne échoue, **le fichier est retiré** :
  sinon il reste un objet payé que plus rien ne désigne. Et si la ligne part
  sans que le fichier suive, c'est dit à l'écran plutôt que tu.

### La doublure a encore dû suivre

`0006` touche le schéma `storage`, absent de la doublure locale. Plutôt que de
rendre la migration conditionnelle — ce qui aurait fait diverger test et
production, exactement le piège corrigé une heure plus tôt —, la doublure a été
étendue. Sa limite est écrite dedans : cela vérifie que le SQL est valide et
que les politiques s'appliquent, **pas** que le service de stockage se comporte
comme en production.

### Vérifié — sorties réelles lues

- `pnpm db:test` : 7 migrations appliquées, 20 tests, 0 échec, exit 0.
- `supabase db reset` : les 6 migrations passent sur PostgreSQL 17.6.1.
- Compartiment réellement présent en base : `listing-photos`, public,
  5 242 880 octets, types `image/jpeg, image/png, image/webp`.
- `pnpm typecheck` exit 0 sur les 3 paquets.
- `next build` exit 0, 6 routes, `ƒ Proxy (Middleware)` listé.
- Page d'accueil rechargée : **24 quartiers, aucune erreur**.

### Non fait

Le téléversement d'une photo n'a **pas** été exercé de bout en bout : cela
suppose une session administrateur dans un navigateur, donc une saisie de mot
de passe que je ne fais pas. Le chemin est vérifié jusqu'à la porte ; le
premier téléversement réel reste à faire par le fondateur.

---

## 2026-08-07 — Une page réelle trouve ce que 20 tests verts n'avaient pas vu

**Déclencheur.** Le fondateur se connecte et tombe sur la page de démonstration
de `create-next-app`. Deux défauts, dont un bien plus grave que l'autre.

### Défaut 1 — aucune porte d'entrée

J'avais construit les écrans d'administration sans jamais remplacer la page
d'accueil ni y mettre le moindre lien. Les écrans existaient et étaient
inaccessibles autrement qu'en tapant l'URL. Remplacée par une vraie page.

**Vérifié d'abord** : les journaux de `next dev` montrent
`GET /admin/listings 307` avant connexion puis `200` après — la garde
`requireAdmin()` fonctionnait, la session aussi. Le problème était bien la
navigation, pas l'authentification.

### Défaut 2 — les GRANT vivaient dans un fichier de TEST

La nouvelle page affichait « 0 quartiers » et
**« permission denied for table listings »**.

Cause : les privilèges de table étaient accordés dans
`supabase/tests/01_grants.sql`. Un fichier de test. **La vraie base ne les a
jamais eus.** Le harnais s'accordait donc des droits que la production n'avait
pas, et les 20 tests RLS passaient au vert en validant un monde qui n'existait
qu'à l'intérieur du test.

C'est le défaut le plus instructif de la session. Ni le typecheck, ni le build,
ni la suite de tests ne pouvaient le voir — **par construction** : un test qui
crée lui-même ses conditions ne mesure plus l'écart avec la réalité. Il a fallu
une page réelle, contre le vrai Supabase, pour qu'il apparaisse.

Corrigé par `0005_grants.sql`, avec les `alter default privileges` pour que la
prochaine table ajoutée n'ait pas à redécouvrir le problème en production.
`tests/01_grants.sql` ne fait plus rien, sinon **vérifier activement** que
`anon` a bien `SELECT` sur `listings` — et échouer sinon.

**Règle qui en découle, désormais écrite dans les deux fichiers** : un fichier
de test ne doit jamais accorder un droit, créer une table ni activer une
extension dont la production a besoin. Sinon il teste sa propre configuration.

### Ce que l'affichage d'erreur a rapporté

La page affichait `error.message` tel quel plutôt qu'une liste vide. C'est ce
qui a rendu le diagnostic immédiat : « permission denied » et « aucune annonce »
se ressemblent à l'écran et se diagnostiquent en sens opposés. Le choix, noté
comme discutable au moment de l'écrire, s'est payé en une seule capture.

### Vérifié — sorties réelles lues

- Page rechargée après correction : **24 quartiers affichés, aucune erreur**.
  Chaîne complète exercée — navigateur, serveur Next, Supabase, RLS anonyme.
- L'état « catalogue vide » est bien un état vide, non une requête en échec.
- `pnpm db:test` : 20 tests, 0 échec. `pnpm check` : exit 0.
- `supabase db reset` : les 5 migrations s'appliquent sur PostgreSQL 17.6.1.
- `next build` : exit 0, 5 routes, `ƒ Proxy (Middleware)` listé.

### Non fait

L'écran d'administration **connecté** n'a toujours pas été vu par moi : je ne
saisis pas de mot de passe dans un formulaire. Les journaux prouvent qu'il rend
un 200 pour une session administrateur ; son apparence reste à confirmer par le
fondateur.

---

## 2026-08-07 — Quartiers, écran d'administration, et premier passage sur le vrai Supabase

**Demande.** Le seed des quartiers et l'écran d'administration.

### Référentiel des quartiers

24 quartiers de Douala avec alias, en migration (`0003`) et non en fichier de
seed : c'est une donnée de référence dont la production dépend, pas un jeu
d'essai. Vérifié par requête : « bepanda tapis rouge » → Bepanda,
« centre administratif » → Bonanjo.

**Réserve écrite dans la migration.** Six quartiers seulement sont attestés par
une source du dépôt — Akwa, Bonanjo, Deido, Bonapriso (CDC §5.1), Bepanda et
Carrefour Andem (captures PUOL). Les dix-huit autres viennent de ma
connaissance générale. Un quartier manquant se corrige en une ligne ; un
quartier faux proposé par l'agent détruit la confiance. **Liste à valider par
quelqu'un sur place.**

### Lecture préalable des guides Next.js 16 — elle a payé

`apps/web/AGENTS.md`, généré par le framework, annonçait des ruptures d'API.
Trois constats tirés des guides embarqués, pas de la mémoire :

- **`middleware.ts` s'appelle `proxy.ts`.** Tous les exemples Supabase en ligne
  disent `middleware.ts` : le fichier aurait été créé, il n'aurait produit
  **aucun effet et aucune erreur**. Confirmé à l'exécution — la sortie de
  `next dev` affiche bien `proxy.ts: 10ms` dans le détail des temps, et le
  build liste `ƒ Proxy (Middleware)`.
- **Une Server Action est joignable par un POST direct**, sans passer par
  l'écran. L'autorisation est donc refaite *à l'intérieur* de l'action.
- `cookies()` et `searchParams` sont asynchrones.

### Manque trouvé en préparant l'essai réel

**Aucun profil n'était créé à l'inscription.** Rien ne reliait `auth.users` à
`profiles` : un utilisateur s'inscrivait, sa ligne d'authentification existait,
son profil non, et toute lecture de rôle retournait vide. Le défaut n'était
visible ni au typecheck, ni au build, ni dans les tests RLS — ceux-ci insèrent
leurs profils à la main. Il n'est apparu qu'en créant un vrai compte via l'API
d'authentification. Migration `0004` ajoutée, avec rôle `TENANT` par défaut :
un propriétaire est promu par un administrateur, jamais par auto-déclaration.

### Trois défauts d'outillage, tous corrigés

1. **Doublure trop pauvre.** `auth.users` n'avait pas `raw_user_meta_data` ; la
   migration 0004 passait sur le vrai Supabase et échouait sur le test rapide.
   Une doublure incomplète ne fait pas gagner du temps, elle fait perdre
   confiance dans le test. Colonne ajoutée, avec la règle écrite dans le
   fichier : toute colonne utilisée par une migration doit y exister.
2. **`run.sh` rejouait le fichier en échec** pour afficher son erreur. Cela
   modifiait l'état de la base et affichait une erreur **différente de la
   vraie** — un doublon de clé au lieu de la cause initiale. Un outil de
   diagnostic qui change ce qu'il mesure envoie chercher au mauvais endroit.
   Sortie désormais capturée au premier passage.
3. **`UID` est en lecture seule sous bash.** Mon affectation a été ignorée
   sans erreur et le script a utilisé l'identifiant du processus. Le résultat
   final montrait pourtant que le déclencheur avait bien fonctionné.

### Vérifié — sorties réelles lues

- **Les 4 migrations s'appliquent sur le vrai Supabase** (PostgreSQL 17.6.1),
  via `supabase db reset`. Cela lève le doute d'ADR-004 sur `btree_gist` en
  environnement réel.
- **Le déclencheur d'inscription fonctionne** : deux comptes créés par l'API
  d'authentification, deux profils présents avec le nom issu des métadonnées.
- `pnpm check` — typecheck des 3 paquets, 7 règles de contraste, **20 tests de
  base** : exit 0.
- `next build` : exit 0, `ƒ Proxy (Middleware)` listé, les deux routes
  d'administration en rendu dynamique.
- `next dev` : `/admin/listings` renvoie **307** sans session — la garde
  `requireAdmin()` redirige. La page de connexion s'affiche avec le violet de
  marque et le fond `paper`, donc les jetons générés sont bien appliqués.
- `.env.local` confirmé ignoré par git (`apps/web/.gitignore:34`).

### Non fait

**L'écran d'administration n'a pas été vu authentifié.** Je ne saisis pas de
mot de passe dans un formulaire, y compris sur un compte d'essai local que
j'ai créé moi-même. Le rendu connecté reste donc à vérifier par le fondateur —
tout le reste du chemin l'est.

---

## 2026-08-07 — Latence mesurée, schéma et politiques RLS livrés et testés

**Demande.** Lancer les mesures, et démarrer le développement sans plus
attendre. Nom du produit : ne doit rien bloquer, un nom de travail suffit.
Nom retenu : **Douala Stays**, explicitement provisoire.

### Latence — la mesure a changé une décision d'architecture

Aller-retour TCP depuis le Cameroun, meilleur de 3 tirs : Virginie 218 ms,
Londres 228 ms, **Paris 245 ms**, Francfort 246 ms, Irlande 279 ms,
**Le Cap 284 ms**, **API OpenAI 61 ms**.

Trois enseignements, dont un qu'aucun raisonnement de cabinet n'aurait donné :

1. **Aucun avantage africain.** Le Cap est la région la plus lente des six.
   Le trafic depuis le Cameroun remonte vers l'Europe quoi qu'il arrive.
   Choisir une région africaine « parce qu'elle est plus proche » aurait été
   une erreur de géographie contre routage.
2. **Toute base est à ~250 ms.** L'écart entre régions est dans le bruit. Ce
   qui compte, c'est que chaque aller-retour coûte un quart de seconde — trois
   requêtes séquentielles font 750 ms de réseau pur. **Conséquence : le schéma
   « le client interroge Supabase directement » est écarté** pour tout ce qui
   demande plus d'une requête. Le serveur Next.js sera colocalisé avec la base ;
   le client fait un aller-retour, le serveur enchaîne en local. ADR-004 mis à
   jour, et cela modifie ADR-003.
3. **OpenAI à 61 ms** — le réseau ne sera pas le goulot de l'agent. La cible
   « premier mot en moins de 3 s » (PRD S5) est jouable.

Région retenue : Paris (`eu-west-3`).

### Schéma et politiques

`supabase/migrations/0001_initial_schema.sql` et `0002_rls_policies.sql`.
10 tables, 4 énumérations, RLS activé partout.

**Défaut de conception corrigé avant test.** J'avais placé `address` dans
`listings`. Or **RLS filtre des lignes, pas des colonnes** : la règle « adresse
masquée jusqu'au paiement » serait retombée dans le code applicatif, qu'une
seule route oubliée suffit à contourner — exactement ce qu'ADR-004 veut
éviter. Adresse et téléphone déplacés dans `listing_contacts`, table séparée
avec sa propre politique. La règle est désormais appliquée par PostgreSQL.

**Contrainte d'exclusion placée sur `listing_blocks`, pas sur `bookings`.**
Une contrainte sur `bookings` n'empêcherait pas un blocage manuel du
propriétaire de recouvrir une réservation confirmée. Centraliser toutes les
périodes donne **une** garantie au lieu de deux règles à tenir cohérentes à la
main. C'est la réponse à la lacune CDC-02.

**`bookings.origin_session_id`** relie une réservation à la conversation qui
l'a produite. Sans ce lien, S1 — la part de réservations initiées via l'agent,
l'indicateur qui décide de la suite du produit — n'est pas mesurable.

### Décision d'outillage : ne pas attendre la pile complète

`supabase start` télécharge plusieurs images ; sur cette connexion, le retour
d'information se serait compté en heures. `postgres:16-alpine` était **déjà en
cache Docker**. J'ai donc écrit une doublure minimale du schéma `auth`
(`supabase/tests/00_local_shim.sql`) reproduisant `auth.users` et `auth.uid()`
à l'identique, et validé le SQL en secondes.

**Limite écrite dans le fichier lui-même** : cela valide le schéma, les
contraintes et les politiques. Cela ne valide **pas** l'intégration réelle avec
Supabase Auth, Storage ou Realtime. Une validation ici n'autorise pas à écrire
« ça marche sur Supabase ».

### Deux bugs trouvés par l'exécution

**1. Dans la doublure.** `auth.uid()` castait `request.jwt.claims` en JSON
avant de tester la chaîne vide : sur une requête anonyme, `''::json` lève une
erreur et **toute politique appelant `auth.uid()` explosait au lieu de refuser
proprement**. Corrigé par un repli sur `'{}'`.

**2. Dans le harnais de test.** Premier passage : 17 sur 20. Les trois échecs
étaient tous des témoins *positifs* — un utilisateur légitime ne voyait rien.
Cause : `set_config(..., true)` pose la variable au niveau de la **transaction**,
et en psql hors transaction explicite chaque instruction est sa propre
transaction. La revendication JWT disparaissait avant l'assertion, `auth.uid()`
retournait null. **Les politiques étaient justes, le harnais était faux.**
Corrigé en portée session.

Ce cas mérite d'être retenu : trois tests rouges désignaient le code alors que
l'erreur était dans l'instrument. Diagnostiquer avant de « corriger » le code a
évité d'affaiblir des politiques qui étaient correctes.

### Vérifié — sorties réelles lues

- Migrations appliquées sur base neuve : `00_local_shim`, `0001`, `0002`,
  `01_grants`, `02_fixtures` — toutes OK.
- **`pnpm db:test` : 20 tests, 0 échec, exit 0.** Dont, nommément :
  - un locataire au statut `ACCEPTED` (avance non vérifiée) **ne voit pas** les
    coordonnées de l'hôte ; celui au statut `CONFIRMED` les voit ;
  - un propriétaire ne voit ni les annonces ni les demandes d'un autre ;
  - un locataire **ne peut pas** confirmer son propre paiement — sinon il
    obtiendrait les coordonnées sans payer ;
  - la contrainte d'exclusion refuse chevauchement et englobement, et autorise
    une arrivée le jour du départ précédent (intervalle semi-ouvert).
- `create extension btree_gist` : réussit sur PostgreSQL 16.

### Non fait

`supabase start` était encore en cours au moment du commit — la pile complète
n'a donc pas servi à cette validation. Les migrations n'ont **pas** encore été
exécutées sur un projet Supabase hébergé.

---

## 2026-08-07 — PRD v1.0 et socle web

**Demande.** Rédiger le PRD, et monter `apps/web` en parallèle. L'installation
web a donc été lancée en arrière-plan **avant** d'écrire le PRD : sur un réseau
à 46 Kio/s, la faire attendre aurait coûté un quart d'heure pour rien.

### PRD v1.0

`docs/documentation/PRD.md` — source de vérité produit (ADR-001). Il tranche
D-04 en réduisant fortement le périmètre, par rapport au CDC **et** à
`plan.md`. Trois coupes, consignées aussi en ADR-008 pour que
`memory/recall_context` puisse alerter un agent qui partirait dans l'autre sens.

1. **Encaissement manuel de l'avance.** `plan.md` §4.2 plaçait l'agrégateur
   dans le MVP. L'argument — sans encaissement, pas de revenu — est juste sur
   le fond mais confond *encaisser* et *automatiser l'encaissement*. Le MVP
   encaisse réellement ; seule l'automatisation attend. Bénéfice décisif : on
   mesure le **taux d'abandon devant l'avance**, information que personne
   n'a et qui conditionne tout le modèle.
2. **Pas de messagerie interne.** WhatsApp après révélation du contact. La
   mécanique anti-désintermédiation repose sur le *moment* de la révélation,
   pas sur le canal.
3. **Annonces saisies par l'équipe.** L'amorçage impose de saisir les 30 à 50
   premières à la main ; construire l'auto-publication avant d'avoir un
   propriétaire autonome, c'est construire à l'aveugle.

Le PRD pose un **point de non-retour délibéré** : la Phase 1 est un prototype
de l'agent sur données réelles, et sous 80 % de requêtes pertinentes, on ne
construit pas la suite. Le risque le plus élevé passe en premier.

Les 11 exigences du CDC reportées ou supprimées sont listées avec leur motif
(§7), comme l'impose le skill `generate_prd` — rien ne disparaît en silence.

`docs/roadmap.md` est marqué remplacé pour sa partie planning : le PRD §8 fait
foi. Trois plannings contradictoires avaient déjà coûté assez cher.

### Socle web

`create-next-app` a produit **Next.js 16.3.1, React 19.2.8, Tailwind 4.3.3**
— versions relevées dans la sortie, non supposées.

**Erreur d'analyse de ma part, corrigée.** J'ai d'abord annoncé que
`create-next-app` avait « cassé le monorepo ». Vérification faite,
`pnpm -r list` listait bien les trois paquets : le monorepo fonctionnait. Le
défaut réel était plus étroit — un **second `pnpm-lock.yaml`** de 137 Ko dans
`apps/web` et un `pnpm-workspace.yaml` imbriqué. Deux verrous, c'est une
ambiguïté sur celui qui fait loi. J'ai diagnostiqué avant de corriger, mais
j'avais annoncé le diagnostic avant de le faire.

Correction appliquée : `ignoredBuiltDependencies` remonté dans le
`pnpm-workspace.yaml` racine, fichiers imbriqués **sauvegardés hors du dépôt**
puis supprimés, `node_modules` local supprimé, réinstallation depuis la racine.

**Défaut trouvé en vérifiant, pas signalé par un outil.** `pnpm typecheck`
affichait `Scope: 2 of 3 workspace projects` : `apps/web` n'avait pas de script
`typecheck`, il était donc **sauté en silence** par la commande racine.
`--if-present` ne se plaint pas d'une absence. Script ajouté ; les deux paquets
sont désormais couverts.

**Vérifié — sorties réelles lues.**

- `pnpm install` depuis la racine : exit 0, 11 min 2 s.
- Espace de travail : 3 membres, **un seul** `pnpm-lock.yaml`, **un seul**
  `pnpm-workspace.yaml` (recherche `find` hors `node_modules`).
- `pnpm typecheck` : exit 0, `packages/ui-tokens` et `apps/web` tous deux
  exécutés.
- `check:contrast` : 7 règles, exit 0.
- `pnpm --filter web build` : exit 0. Compilé en 29,8 s avec Turbopack,
  TypeScript en 4,7 s, 4 pages statiques générées, routes `/` et `/_not-found`.
- `git check-ignore` : `.next/`, `apps/web/node_modules` et `node_modules`
  correctement ignorés.
- 56 liens internes vérifiés dans tout le dépôt, 0 cassé.

**À connaître pour la suite.** `apps/web/AGENTS.md`, généré par Next.js
lui-même et régénéré à chaque `next dev`, signale que **cette version comporte
des ruptures d'API** par rapport aux versions antérieures, et pointe ses guides
dans `node_modules/next/dist/docs/`. À lire avant d'écrire le premier écran,
sous peine d'écrire du Next.js d'une version qui n'existe plus.

**Divergence non tranchée.** La racine est en TypeScript 7.0.2, `apps/web` en
5.9.3 — la version avec laquelle Next.js 16.3.1 est livré et validé. Deux
compilateurs dans un dépôt est une odeur. Non résolu aujourd'hui : le build
passe, et aligner sans tester ferait courir un risque pour un gain esthétique.
À trancher par un essai réel.

**Non commité, signalé.** Deux fichiers sont apparus dans
`InspirationsMaquettes/` pendant la session — `chatbot.png` et `chatbot1.png`.
Ils ne font pas partie du périmètre demandé et n'ont pas été ouverts.

---

## 2026-08-07 — Arbitrages rendus, socle du monorepo posé

**Mandat.** Le fondateur délègue l'arbitrage de D-01, D-03 et D-06, lève la
contrainte de stack (« la stack n'est pas imposée, on est libres »), demande du
React Native pour iOS et Android, demande de trancher entre Supabase et Docker,
et fixe la palette à partir d'un visuel de marque XENOS itech.

**Lecture préalable.** Les 21 skills de `agent-skills/` ont été lus
intégralement avant toute décision — c'était la demande, et c'était nécessaire :
`documentation/generate_prd` pose déjà que *« le PRD prime sur tout artefact
antérieur en cas de conflit »*. D-06 avait donc une réponse native dans le
dépôt. L'inventer aurait été une faute.

**Sept ADR rendues** — index dans `docs/memory/decisions/INDEX.md`. Les deux
qui méritent d'être justifiées ici :

- **ADR-002** — les artefacts des skills sont préfixés par `docs/`. Appliqués
  tels quels, ils auraient créé sept dossiers de documentation à la racine, en
  concurrence avec `docs/`. C'est le premier piège de la liste : deux
  arborescences qui divergent, et un correctif appliqué à la copie morte.
- **ADR-004** — la question « Supabase ou Docker » contenait une fausse
  alternative : la CLI Supabase démarre sa pile **dans** Docker en local. La
  vraie question était qui exploite la base en production. Retenu : Supabase,
  et la raison qui pèse le plus n'est pas le gain de temps mais le fait que la
  règle « un propriétaire ne voit que ses logements » devienne une politique
  appliquée par PostgreSQL, pas un intercepteur qu'on peut oublier d'appeler.

`docs/decisions.md` est marqué remplacé, pas supprimé : il porte le
raisonnement qui a mené aux arbitrages.

**Socle posé et vérifié** : `pnpm-workspace.yaml`, `package.json`,
`tsconfig.base.json` (strict, `noUncheckedIndexedAccess`), et
`packages/ui-tokens` avec la palette d'ADR-006.

### Trois incidents, tous instructifs

**1. Installation en échec sur le réseau, pas sur la configuration.**
`pnpm add -D typescript` a résolu TypeScript **7.0.2**, qui télécharge un
binaire natif par plateforme (`@typescript/typescript-win32-x64`). Ce binaire a
échoué en `ECONNRESET` après ré-essais. Débit relevé dans la sortie :
**46 Kio/s**, une requête à 93 secondes. Le manifeste contenait `typescript`,
le binaire n'était pas sur le disque, `tsc` ne démarrait pas. Relancé avec
`--fetch-retries=6` et `--network-concurrency=2` : succès après un `ENOTFOUND`.
**Conséquence à retenir pour la suite : ce réseau est lent et instable. Les
installations d'Expo et de Next.js seront longues et devront être lancées en
arrière-plan, pas attendues.**

**2. Le typecheck est passé sur un paquet non chargeable.** `index.ts`
réexportait `'./colors'` sans extension. `tsc` en résolution `Bundler` compile
sans broncher ; Node ESM refuse le module. **Typecheck vert, exit 0, et le
paquet inutilisable** — l'illustration la plus nette de « un signal partiel ne
prouve rien ». Découvert uniquement parce que le paquet a été *chargé pour de
vrai*, pas seulement compilé. Corrigé par extension `.ts` explicite +
`allowImportingTsExtensions`, seule forme qui fonctionne à la fois sous les
bundlers et sous Node.

**3. Un chiffre faux dans une ADR, attrapé par l'exécution.** ADR-006
annonçait `19,0:1` de contraste pour `ink-900` sur blanc. Le calcul réel donne
**18,88:1** : mon arithmétique manuelle avait pris la mauvaise branche de la
formule WCAG — division par 12,92 alors que le seuil de 0,03928 n'était pas
atteint. Sans effet sur la décision (AAA dans les deux cas), mais un document
de référence qui porte un chiffre faux coûte plus cher que pas de document.
ADR-006 corrigée, avec la mention de l'erreur.

### Le garde-fou né de l'erreur

Plutôt que de recopier des ratios à la main, ils sont désormais vérifiés par
`pnpm --filter @app/ui-tokens check:contrast`, qui échoue si une modification
de la palette casse un seuil WCAG.

**Vérifié — sorties réelles lues.**

- `tsc --version` → `Version 7.0.2`, après présence confirmée du binaire de
  plateforme sur le disque.
- `@types/node` → `26.2.0`.
- `pnpm typecheck` → exit 0.
- `check:contrast` → 7 règles vérifiées, exit 0. Valeurs mesurées :
  `ink-900`/blanc 18,88 ; `ink-700`/blanc 13,58 ; `violet-700`/blanc 9,40 ;
  `violet-700`/`paper` 8,43 ; `gray-500`/blanc 5,33 ; `magenta-500`/blanc 5,73.
- **Contrôle du garde-fou sur un cas qu'il doit rejeter** : `violet-700`
  temporairement remplacé par `#B79CE0`, sauvegarde du fichier hors du dépôt au
  préalable. Résultat : 3 règles en échec, exit 1. Fichier restauré, `cmp`
  confirme l'identité octet pour octet avec la sauvegarde. **Un garde-fou qui
  n'a jamais échoué n'a jamais été testé.**
- `tsconfig.json` du paquet corrigé : `include` ne couvrait que `src/`, le
  script de `scripts/` serait passé hors typecheck sans que rien ne le signale.

**Réponse du fondateur en cours de session** : XENOS itech est sa structure, pas
la marque du produit, dont le nom n'est pas arrêté. ADR-006 mise à jour : la
palette devient explicitement **provisoire**, et la règle « aucune couleur en
dur hors de `packages/ui-tokens` » cesse d'être une bonne pratique pour devenir
la condition d'un changement de marque à coût d'une heure.

**Non fait.** `apps/mobile` et `apps/web` ne sont pas créés. Les identifiants
d'application iOS et Android sont définitifs après la première publication en
store ; le nom commercial n'étant pas arrêté, les créer maintenant ferait
porter au projet un identifiant provisoire qui a toutes les chances de rester.
Rien d'autre ne dépend de cette attente : le socle, les jetons et les décisions
avancent sans.

---

## 2026-08-07 — Mise sous versionnement du travail d'audit

**Contexte.** Après le rapatriement des skills, trois lots restaient hors du
dépôt : 27 captures non suivies, les garde-fous, et `docs/`. Découpés en trois
commits distincts plutôt qu'un seul : un `add` global aurait mélangé de la
documentation, de la configuration et des binaires dans un diff illisible, et
rien n'aurait expliqué pourquoi chacun était là.

**Ordre imposé, et pourquoi.** Les captures d'abord, **telles quelles**, sans
renommage ni déplacement. C'est ce qui permettra à la réorganisation prévue
(`structure-cible.md`) d'apparaître dans l'historique comme un déplacement et
non comme une suppression suivie d'une création.

| Commit | Contenu | Ce qui a été vérifié avant de committer |
|---|---|---|
| `e93251c` | 27 captures PUOL | 27 fichiers indexés, tous en statut `A`, **aucun fichier hors périmètre** — contrôlé par filtrage explicite de `git diff --cached --name-only` |
| `ab562ec` | `.gitignore`, `.gitattributes`, `README.md` | `git check-ignore -v .env` → `.gitignore:5:.env` sur un fichier de test, supprimé ensuite |
| *(celui-ci)* | `docs/` | — |

**Vérifié après le commit des garde-fous.**

- `git ls-files --eol README.md` → `i/lf  w/lf  attr/text=auto eol=lf`. Le
  fichier est **enfin stocké comme du texte** dans l'index, après avoir été un
  binaire depuis le premier commit du dépôt. La prédiction posée plus tôt dans
  ce journal — « le statut redeviendra textuel une fois le nouveau blob
  commité » — est donc confirmée par lecture, pas par raisonnement.
- `git status --short` juste après : seul `docs/` non suivi. **Aucune
  renormalisation surprise** provoquée par l'arrivée de `.gitattributes` sur les
  fichiers déjà versionnés. Ce point méritait un contrôle : appliquer
  `text=auto eol=lf` à un dépôt existant peut déclencher la réécriture en masse
  de fichiers qu'on ne comptait pas toucher.
- Messages de commit relus via `git log --format=%B` : les accents sont stockés
  correctement en UTF-8, non mutilés par la chaîne d'outils Windows.

**Règle appliquée sans exception.** Aucun `git add .` ni `git add -A`. Chaque
lot a été indexé par chemin explicite, puis l'index a été relu avant le commit.
Un `add` global emporte le travail en cours de quelqu'un d'autre.

---

## 2026-08-07 — Rapatriement de `agent-skills/` et `plan.md` dans `main`, et publication

**Demande.** Récupérer les skills et les publier, pour pouvoir s'en servir.

**Rectification d'une prémisse, avant d'agir.** La demande supposait des commits
locaux non poussés. Il n'y en avait pas : `git rev-list --left-right --count
origin/main...HEAD` retourne `0  0`. Les deux commits du 9 juillet **étaient
poussés** depuis le début — ils n'avaient simplement jamais été **fusionnés**
dans `main`. Le problème n'était pas la publication, c'était l'intégration. La
distinction compte : chercher des commits locaux introuvables aurait fait perdre
du temps sans jamais toucher la cause.

**Fait.** `git merge --no-ff origin/check-github-repo-airbnbprojet`, puis
`git push origin main`. Commit de fusion `1bce84b`.

Choix de la fusion complète plutôt que d'extraire les seuls fichiers demandés :
n'extraire que `agent-skills/` aurait perdu l'historique et l'auteur d'origine,
et laissé `plan.md` orphelin sur une branche que personne ne suit — c'est-à-dire
recréé exactement le problème qu'on venait de corriger. `plan.md` est donc
rapatrié avec. **Cela ne lui donne aucune autorité sur le CDC** : l'arbitrage
D-06 reste entier.

**Vérifié — sorties réelles lues.**

- Avant fusion : intersection entre les fichiers apportés par la branche et les
  fichiers modifiés dans l'arbre de travail → **vide**. La fusion ne pouvait pas
  écraser le travail en cours.
- Après fusion : 22 fichiers créés, +1236 lignes, `agent-skills/` contient bien
  21 fichiers, aucun vide ni tronqué, contenu réel lu sur
  `agent-skills/strategy/define_vision.md`.
- Après poussée : **vérification depuis l'extérieur**, par clone neuf de
  `https://github.com/Rubens-Dev11/Airbnbprojet.git`. `git ls-remote` déclare
  `main` sur `1bce84b`, le clone contient les 21 skills et les 242 lignes de
  `plan.md`.

**Ce que la vérification externe a révélé — le piège des fins de ligne, en
direct.** L'empreinte agrégée des 21 skills diffère entre le poste et le clone
neuf : `b338fd7c…` contre `b63d7796…`. Diagnostic mené jusqu'au bout plutôt
qu'écarté :

- Sur un fichier témoin : 1709 octets et **0 CR** sur le poste, 1754 octets et
  **45 CR** dans le clone.
- Contenu comparé après suppression des CR : **identique sur les 22 fichiers**.
- Cause : `.gitattributes` existe sur le poste mais **n'est pas encore commité**.
  Le poste applique donc `eol=lf` ; le clone, lui, ne voit aucun
  `.gitattributes` et applique `core.autocrlf = true`, donc CRLF.

**Conséquence directe, à traiter en priorité.** Tant que `.gitattributes` n'est
pas commité, **chaque clone reçoit des octets différents de ceux de la machine
de référence**. Aujourd'hui l'écart est inoffensif — ce sont des fichiers
Markdown. Il cessera de l'être dès qu'un script, un fichier de verrouillage ou
un contrôle d'empreinte entrera dans le dépôt.

**Non fait.** `.gitattributes`, `.gitignore`, `README.md`, `docs/` et les
27 captures PUOL restent non commités : la demande portait sur les skills. Les
six branches `v0/group-xprience-*` vides et la branche
`check-github-repo-airbnbprojet`, désormais entièrement fusionnée, n'ont pas été
supprimées — action irréversible côté GitHub.

**Erreur commise pendant la vérification, à retenir.** Le premier contrôle
d'octets NUL utilisait `grep -q $'\x00'` : en bash, `$'\x00'` produit une chaîne
**vide**, donc le motif correspond à tout et les 22 fichiers ont été signalés
comme suspects. Le test rendait un verdict faux, pas les fichiers. Refait par
`tr -d '\000' | cmp`, **et validé sur un fichier témoin contenant réellement un
NUL** avant d'accepter son verdict. Un test qui n'a jamais échoué sur un cas
qu'il devrait détecter ne prouve rien.

---

## 2026-08-07 — Découverte d'un travail antérieur non fusionné, et correction des documents rédigés le jour même

**Déclencheur.** Question posée en cours de session : « vois-tu des commits qui
n'ont pas été poussés ? » La réponse locale était non — mais la vérifier
sérieusement imposait d'interroger le remote lui-même, pas la référence locale
`origin/main`, qui n'est qu'un cache et peut affirmer une synchronisation
périmée.

**Ce que la vérification a montré.** `git ls-remote origin` retourne **huit**
branches là où le poste n'en connaissait qu'une. L'une d'elles,
`check-github-repo-airbnbprojet` (`e60b0f4`), porte 2 commits du 9 juillet 2026
signés `v0 <it+v0agent@vercel.com>`, soit 22 fichiers et +1236 lignes jamais
fusionnées : un plan stratégique de 242 lignes (`plan.md`) et 21 fichiers de
méthode (`agent-skills/`). Les six autres, `v0/group-xprience-*`, pointent
toutes sur le commit de `main` et ne contiennent rien.

**Pourquoi c'est grave.** `plan.md` n'est pas une esquisse : il contient un
modèle économique chiffré, une intégration de paiement Mobile Money, une
mécanique anti-désintermédiation et une stratégie d'amorçage de l'offre —
autant de sujets absents du cahier des charges. Et il **contredit** le CDC sur
sept points structurants, dont l'architecture. Deux références produit
coexistaient donc sans qu'aucune n'ait autorité, l'une d'elles invisible depuis
le poste de travail. Un travail stratégique qu'on ne voit pas finit par être
refait.

**Conséquence sur le travail de la même session.** L'état des lieux, les
décisions et la roadmap avaient été rédigés une heure plus tôt **sans cette
information**. Ils affirmaient un état du dépôt incomplet. Ils ont été corrigés,
pas complétés en silence :

- `etat-des-lieux.md` — synthèse §1 réécrite (le problème devient le premier
  des quatre), tableau de versionnement §2.1 refait avec les preuves réelles,
  constat C-07 ajouté, **nouvelle section §5** consacrée à la branche et à ses
  limites, sections suivantes renumérotées.
- `decisions.md` — **D-06 ajouté** (que fait-on de la branche, qui a autorité) ;
  DA-04 assorti d'une réserve explicite ; D-01, D-02, D-03, D-04 et D-05
  réécrits pour intégrer les réponses que `plan.md` apporte déjà.
- `roadmap.md` — avertissement en tête, Sprint 0 réordonné, comparaison des
  trois plannings en présence ajoutée en fin de document.
- `veille-concurrence.md` — `plan.md` ajouté à la liste des documents portant
  l'affirmation « aucun concurrent local », avec la chronologie qui les
  disculpe.
- `docs/README.md` et `README.md` — avertissement sur la double référence.

**Vérifié — sorties réelles lues.**

- `git rev-list --left-right --count origin/main...HEAD` → `0  0` : aucun commit
  local en attente de poussée.
- `git stash list` → vide. `git branch -vv` → `main` seule, suivant
  `origin/main`.
- `git ls-remote origin` → 8 références de branches, 6 sur
  `2961ef061bbaacdf9c7c4de816ff85a2b81aad5d` (identique à `main`), une sur
  `e60b0f44dc96cedb02bf36d81fbb96d8a54a3e88`.
- `git log main..origin/check-github-repo-airbnbprojet` → 2 commits, horodatés,
  auteur lu.
- `git diff --stat main...origin/check-github-repo-airbnbprojet` → 22 fichiers,
  +1236 lignes.
- `plan.md` et `agent-skills/README.md` extraits via `git show` et **lus
  intégralement**, pas résumés depuis les noms de fichiers.

**Contrôle d'intégrité du cahier des charges — alerte levée puis écartée.**
`git log --stat` du premier commit affiche `CDC_Plateforme_Douala_v2.pdf | 385
+++++` : git a traité le PDF comme du **texte**, pas comme un binaire. Or
`core.autocrlf` valait `true`, ce qui applique une conversion de fins de ligne
au moment du commit. Un PDF ainsi normalisé peut être corrompu de façon
silencieuse — le fichier reste sur le disque, mais toute personne qui clone
récupère un document illisible. Vérifié plutôt que supposé :

- Extraction octet-exacte du blob de `HEAD`, puis comparaison d'**empreintes**,
  pas de tailles ni de dates.
- `sha256sum` du fichier de travail et du blob :
  `414fdea5ff7951bb66c3a5cf802a2fd220807fe357a193e1231d682c8314a9b8` — **identiques**.
- `pdftotext` exécuté sur le blob extrait : réussite, 18 262 octets de texte
  cohérent.

**Conclusion : le PDF versionné est intact.** Le `.gitattributes` posé dans
cette session le marque désormais `binary`, ce qui empêche que la question se
repose.

**Piège rencontré pendant ce contrôle, à retenir.** La première extraction du
blob a été faite avec la redirection `>` de PowerShell : le fichier obtenu
faisait 37 117 octets contre 36 721 au fichier de travail, et les empreintes
divergeaient. **La corruption venait de l'outil de mesure, pas du dépôt** —
`>` réencode le flux au lieu de le copier octet pour octet. Pour extraire un
binaire de git sous Windows, passer par un shell POSIX, jamais par `>` ni
`Out-File`. Une mesure fausse a exactement le même effet qu'un défaut réel :
elle envoie diagnostiquer un problème qui n'existe pas.

**Non vérifié, et signalé comme tel.** Les recommandations de prestataires de
paiement de `plan.md` (NotchPay, CinetPay, Flutterwave) n'ont fait l'objet
d'aucune vérification : ni existence, ni tarifs, ni conditions d'accès, ni
délai d'intégration. Aucun accès externe n'a été utilisé pendant cet audit.

**Non fait.** La branche n'a été **ni fusionnée, ni supprimée**, et aucune des
six branches vides non plus. Supprimer une branche distante est irréversible
côté GitHub ; fusionner engage la référence produit du projet. Les deux
relèvent d'une décision explicite, pas d'un effet de bord d'audit. Commandes
prêtes dans `decisions.md` D-06 et `structure-cible.md`. Un `git fetch --prune`
a en revanche été exécuté : opération locale, non destructive, sans laquelle
les branches distantes restaient invisibles.

---

## 2026-08-07 — Audit initial et mise en place de la gouvernance projet

**Contexte.** Le dépôt existait depuis le 9 juillet 2026 avec deux commits
(`8e7e48f first commit`, `2961ef0 documentations`) ne contenant que de la
documentation et des images. 27 fichiers traînaient non versionnés depuis le
17 juillet. Aucune règle de travail n'était écrite dans le dépôt, aucun état
des lieux, aucun garde-fou de versionnement.

**Pourquoi maintenant.** Avant d'écrire la première ligne de code applicatif, la
stack prévue (NestJS + OpenAI + Cloudinary + JWT) impose de manipuler des
secrets et des `node_modules`. Un dépôt sans `.gitignore` à ce moment-là, c'est
une clé API publiée au premier `git add`. Un secret publié ne se dépublie pas.
La mise en place des garde-fous devait donc précéder le code, pas le suivre.

**Fait.**

1. `.gitignore` créé — n'existait pas. Priorité aux secrets (`.env`, `*.pem`,
   `*.key`), puis `node_modules/`, artefacts de build, couverture, logs.
   `prisma/migrations/` volontairement **non** ignoré : les migrations doivent
   être versionnées, sinon toute base reconstruite est incomplète.
2. `.gitattributes` créé — n'existait pas. `git config core.autocrlf` vaut
   `true` sur ce poste : sans normalisation, le fichier versionné cesse de
   correspondre octet pour octet à ce qui sera déployé. Règle retenue : LF
   partout, sauf `.bat`/`.cmd`/`.ps1`. Images et PDF marqués `binary`.
3. `README.md` réécrit. **Motif technique, pas cosmétique** : le fichier
   versionné était encodé en UTF-16 LE avec BOM (octets `FF FE`, 34 octets), ce
   qui faisait que git le traitait comme un **binaire** — visible dans
   `git log --stat` du premier commit : `README.md | Bin 0 -> 34 bytes`. Un
   README binaire n'est ni diffable, ni relisible en revue, ni rendu
   correctement partout.
4. `docs/` créé avec sept documents de gouvernance (voir `docs/README.md`).

**Vérifié — sorties réelles lues.**

- `git config --get core.autocrlf` → `true`.
- `[IO.File]::ReadAllBytes('README.md')[0..7]` avant réécriture →
  `FF FE 23 00 20 00 41 00` — confirme UTF-16 LE + BOM.
- `git grep -I --name-only -e "" -- README.md` → code de sortie 1, aucun
  fichier listé : git confirme le traitement binaire.
- Après réécriture : `README.md` = 2627 octets, 4 premiers octets `23 20 50 6C`
  (« # Pl » en ASCII), **0 octet NUL** dans le fichier. Encodage UTF-8 confirmé.
- `git diff --numstat -- README.md` affiche toujours `-  -`. **Ce n'est pas un
  échec** : git force le mode binaire dès qu'**un** des deux côtés du diff est
  binaire, et le blob de `HEAD` l'est. Le statut redeviendra textuel une fois le
  nouveau blob commité. Constat posé, pas supposé.
- `.gitignore` (3411 o) et `.gitattributes` (997 o) : premiers octets `23 20…`,
  UTF-8, pas de BOM.

**Incident rencontré, à retenir.** La première réécriture de `README.md` par
outil d'édition a **conservé l'encodage UTF-16 du fichier existant** au lieu de
produire de l'UTF-8 : le fichier faisait 5094 octets et commençait par
`23 00 20 00`. Écrire un fichier « avec succès » ne prouve pas qu'il est dans le
bon encodage. Correctif appliqué : suppression du fichier puis création
ex nihilo, ce qui produit bien de l'UTF-8. Vérifier l'encodage après écriture
fait désormais partie du protocole pour tout fichier réécrit sur ce dépôt.

**Non fait, volontairement.**

- Aucun commit, aucun `git add`, aucun push : non demandé. Les commandes prêtes
  à exécuter figurent dans `docs/structure-cible.md`.
- Aucun déplacement ni renommage des dossiers d'images. La règle de
  versionnement impose de committer d'abord un existant non versionné **tel
  quel**, puis les modifications — or 27 fichiers de `InspirationsMaquettes/`
  ne sont pas encore versionnés. Réorganiser avant de les committer produirait
  un diff illisible.
- Aucun squelette applicatif (Next.js / NestJS / Prisma) : non demandé, et
  quatre arbitrages produit restent ouverts (voir `docs/decisions.md`).
