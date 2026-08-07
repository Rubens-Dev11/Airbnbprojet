# Journal des modifications

Une entrée par tâche. Chaque entrée dit **pourquoi**, pas seulement quoi — le
quoi est dans le diff, le pourquoi disparaît avec la personne qui l'a écrit.
Chaque entrée dit aussi **ce qui a été vérifié, et comment**.

Format : entrée la plus récente en haut.

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
