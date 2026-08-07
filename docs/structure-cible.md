# Structure cible du dépôt

Deux parties : la réorganisation des références (faisable immédiatement) et
l'arborescence applicative (conditionnée à l'arbitrage D-03 de `decisions.md`).

---

## 1. Pourquoi réorganiser

État constaté au 7 août 2026 :

- `InspirationsMaquettes/` mélange **trois sources sans rapport** : captures de
  l'app Airbnb officielle, un concept Figma mobile orange, et 27 captures d'une
  application concurrente réelle (PUOL). Un dossier qui dit « inspirations »
  alors qu'il contient de la veille concurrentielle fait perdre l'information la
  plus importante du dépôt.
- 27 fichiers portent un nom horodaté WhatsApp (`WhatsApp Image 2026-07-17 at
  04.56.51 (1).jpeg`) qui ne dit rien de leur contenu, et **ne sont pas
  versionnés**.
- Trois conventions de nommage cohabitent à la racine : `fluxdereservation`,
  `InspirationsMaquettes`, `infoAirbnbPlaystore`.

## 2. Arborescence cible des références

```
docs/
  references/
    airbnb-parcours/      <- fluxdereservation/          (23 PNG)
    airbnb-playstore/     <- infoAirbnbPlaystore/        (1 TXT + 7 JPEG)
    inspirations-ui/      <- InspirationsMaquettes/*.png (10 PNG)
    puol/                 <- les 27 JPEG du 2026-07-17
  cdc/
    CDC_Plateforme_Douala_v2.pdf
```

## 3. Ordre d'exécution — à respecter

L'ordre n'est pas indifférent. Committer d'abord l'existant non versionné **tel
quel**, puis seulement réorganiser : sinon git présente les 27 fichiers comme
des créations et le déplacement disparaît du diff.

### Étape 1 — Committer les 27 fichiers tels quels

```powershell
git add "InspirationsMaquettes/WhatsApp Image 2026-07-17*"
```

Puis **lire la sortie** avant de committer :

```powershell
git status --short
```

Attendu : 27 lignes `A  InspirationsMaquettes/WhatsApp Image 2026-07-17...`, et
rien d'autre. Si autre chose apparaît, s'arrêter et diagnostiquer.

```powershell
git commit -m @'
Versionne les captures PUOL recues le 17 juillet

Ces 27 captures d'ecran documentent une application concurrente en service
sur le marche cible (chambres meublees a Douala). Elles dormaient non
versionnees depuis trois semaines : ni sauvegardees, ni partagees, ni sur
GitHub. Elles sont commitees telles quelles, sans renommage ni deplacement,
pour que la reorganisation qui suit apparaisse comme un deplacement et non
comme une creation.
'@
```

### Étape 2 — Committer les garde-fous et la documentation

```powershell
git add .gitignore .gitattributes README.md docs/
git status --short
```

```powershell
git commit -m @'
Met en place les garde-fous de versionnement et la documentation projet

Avant d'introduire une stack qui manipule des cles API (OpenAI, Cloudinary,
JWT, URL PostgreSQL), le depot n'avait ni .gitignore ni .gitattributes. Le
premier `git add .` aurait publie le .env ; un secret publie ne se depublie
pas, il se revoque.

- .gitignore : secrets d'abord, puis node_modules et artefacts de build.
  prisma/migrations reste volontairement versionne.
- .gitattributes : core.autocrlf valait true sur le poste, donc le contenu
  versionne dependait du poste qui commitait. LF partout desormais.
- README.md : etait encode en UTF-16 LE, ce qui faisait que git le traitait
  comme un binaire (visible dans git log --stat : "Bin 0 -> 34 bytes").
  Reecrit en UTF-8, donc de nouveau diffable et relisible en revue.
- docs/ : regles de travail, etat des lieux, decisions, roadmap, journal.
'@
```

### Étape 2 bis — Statuer sur la branche `check-github-repo-airbnbprojet`

**Ne pas enchaîner sur l'étape 3 sans avoir traité ce point** : la branche
apporte `plan.md` et `agent-skills/` à la racine, ce qui change l'arborescence
cible. Réorganiser d'abord obligerait à réorganiser deux fois. Décision et
options : `decisions.md` D-06.

Pour inspecter avant de décider, sans rien modifier :

```powershell
git show origin/check-github-repo-airbnbprojet:plan.md | more
```

Si l'option retenue est la fusion complète :

```powershell
git merge --no-ff origin/check-github-repo-airbnbprojet
```

Si l'option retenue est l'extraction du seul `plan.md` vers `docs/` :

```powershell
git show origin/check-github-repo-airbnbprojet:plan.md | Out-File -FilePath docs/plan-strategique-v1.md -Encoding utf8
```

Dans ce second cas, vérifier l'encodage du fichier produit avant de le
committer — `Out-File -Encoding utf8` ajoute un BOM sous Windows PowerShell 5.1,
et un `README.md` de ce dépôt a déjà été traité comme un binaire par git pour
une raison de ce genre (C-02) :

```powershell
(Get-Content docs/plan-strategique-v1.md -Encoding Byte -TotalCount 3) -join ' '
```

`239 187 191` signale un BOM UTF-8 : à retirer. Toute autre valeur convient.

### Étape 3 — Réorganiser (une fois, et seulement une fois, les étapes 1, 2 et 2 bis traitées)

```powershell
New-Item -ItemType Directory -Force docs/references/puol, docs/references/inspirations-ui, docs/cdc | Out-Null
git mv fluxdereservation docs/references/airbnb-parcours
git mv infoAirbnbPlaystore docs/references/airbnb-playstore
git mv CDC_Plateforme_Douala_v2.pdf docs/cdc/CDC_Plateforme_Douala_v2.pdf
Get-ChildItem "InspirationsMaquettes/*.png" | ForEach-Object { git mv $_.FullName "docs/references/inspirations-ui/$($_.Name)" }
Get-ChildItem "InspirationsMaquettes/WhatsApp Image 2026-07-17*" | ForEach-Object { git mv $_.FullName "docs/references/puol/$($_.Name)" }
```

Vérifier que git a bien reconnu des **déplacements** et non des
suppressions/créations :

```powershell
git status --short
```

Attendu : des lignes commençant par `R` (renamed). Si ce sont des `D` et des
`A`, ne pas committer : diagnostiquer d'abord.

Le dossier `InspirationsMaquettes/` doit alors être vide. Le supprimer
manuellement après vérification.

> **Renommage des 27 fichiers PUOL** : non fait, volontairement. Donner un nom
> parlant à chaque capture suppose de les ouvrir une à une ; seules 5 l'ont été
> lors de l'audit. Nommer les 22 autres au jugé produirait des noms faux, ce qui
> est pire qu'un nom illisible. À faire par la personne qui les parcourt.

### Étape 4 — Mettre à jour les liens

Une fois les fichiers déplacés, les chemins cités dans `README.md`,
`docs/etat-des-lieux.md` et `docs/veille-concurrence.md` deviennent faux. Les
corriger **dans le même commit** que le déplacement.

---

## 4. Arborescence applicative visée

**Conditionnée à l'arbitrage D-03.** Proposition, monodépôt `pnpm workspaces` :

```
apps/
  web/                  Next.js 14 — interface publique, espaces proprietaire et admin
  api/                  NestJS 10 — API REST, agent IA, RBAC
packages/
  shared/               Types partages entre web et api (contrats d'API, enums)
prisma/
  schema.prisma
  migrations/           VERSIONNE — ne jamais ignorer
docs/
docker-compose.yml      PostgreSQL local (psql n'est pas installe sur le poste)
.env.example            NOMS des cles uniquement, jamais de valeurs
.nvmrc                  Version de Node epinglee
```

Points à trancher au moment du squelette, et non avant :

- Version de Node à épingler. Le poste est en v24.14.1 ; NestJS 10 a été validé
  sur des versions antérieures. Compatibilité **non vérifiée** à ce jour.
- Langue des identifiants du schéma Prisma. Le CDC §7 emploie des noms français
  (`prix_nuit`, `date_debut`, `proprietaire_id`). Choisir, puis s'y tenir : un
  schéma moitié français moitié anglais coûte cher pendant des années.
