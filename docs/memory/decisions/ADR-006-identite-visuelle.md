# ADR-006 — Identité visuelle : violet, noir, blanc, gris

- **Statut** : Acceptée, **valeurs hexadécimales à confirmer**
- **Date** : 2026-08-07
- **Domaine** : Design
- **Remplace** : l'arbitrage ouvert D-02 de `docs/decisions.md`

## Contexte

`InspirationsMaquettes/` contenait **trois** directions visuelles incompatibles
— captures d'Airbnb, concept Figma orange, concept éditorial sombre — plus une
quatrième référence de fait, le vert de PUOL. Aucune n'avait été choisie, donc
chaque écran aurait été arbitré à la volée.

Le fondateur a tranché en fournissant un visuel de marque **XENOS itech** et en
demandant : *« pour le code couleur on va partir sur toutes les couleurs de
cette image (noir blanc violet gris...) »*.

## Décision

Palette **violet / noir / blanc / gris**, dérivée du visuel XENOS itech. Elle
remplace les trois directions précédentes, qui deviennent des références
d'ergonomie uniquement — `fluxdereservation/` reste précieux pour la
**structure** des écrans d'Airbnb, plus du tout pour ses couleurs.

Ce choix a un avantage concurrentiel involontaire mais réel : **PUOL est vert**.
Un violet profond ne sera jamais confondu avec lui dans une capture d'écran
partagée sur WhatsApp.

### Jetons

Source unique : `packages/ui-tokens`, consommée par Tailwind (web) et NativeWind
(mobile). Aucune couleur écrite en dur ailleurs.

| Jeton | Valeur | Usage |
|---|---|---|
| `violet-900` | `#3D1A52` | Aplats sombres, en-têtes pleins |
| `violet-800` | `#4F2270` | États pressés |
| **`violet-700`** | **`#5D2E8C`** | **Couleur primaire — boutons, liens, éléments actifs** |
| `violet-600` | `#7038A8` | Survol de la primaire |
| `violet-500` | `#8B4CC4` | Illustrations, graphiques |
| `violet-400` | `#A97FD6` | Bordures accentuées |
| `violet-300` | `#C4A9E4` | Dégradé bas du visuel de marque |
| `violet-200` | `#DDCBEF` | Fonds de sélection |
| `violet-100` | `#EFE7F7` | Fonds d'information |
| `violet-50` | `#F8F4FC` | Survol de ligne dans un tableau |
| `magenta-500` | `#B02A9D` | Accent — badges, mises en avant, dégradé du logo |
| `ink-900` | `#111111` | Texte principal |
| `ink-700` | `#2E2E2E` | Texte secondaire |
| `gray-500` | `#6B6B6B` | Texte tertiaire, libellés |
| `gray-300` | `#D4D4D4` | Bordures |
| `gray-100` | `#EDEDED` | Séparateurs, fonds inertes |
| `paper` | `#F4F2F3` | Fond d'application — le blanc cassé texturé du visuel |
| `white` | `#FFFFFF` | Cartes, surfaces élevées |

Dégradé de marque : `magenta-500 → violet-700`, orientation haut-gauche vers
bas-droite, comme le logo. **Réservé à l'identité** — logo, écran d'accueil,
en-têtes de marque. Jamais sur un bouton d'action : un dégradé sous un libellé
rend le contraste imprévisible.

### Contrastes

**Calculés par exécution**, pas estimés — et pas non plus calculés à la main :

| Paire | Ratio | Verdict |
|---|---|---|
| `ink-900` sur `white` | **18,88 : 1** | AAA, tout usage |
| `violet-700` sur `white` | **9,40 : 1** | AAA, tout usage |
| `white` sur `violet-700` | **9,40 : 1** | AAA — bouton primaire validé |
| `violet-700` sur `paper` | **8,43 : 1** | AAA, tout usage |
| `magenta-500` sur `white` | **5,73 : 1** | AA en texte normal, AAA en grand. **Pas pour du texte long** |

Règle qui en découle : `magenta-500` est un **accent**, jamais une couleur de
texte courant. Le CDC §9 exige des contrastes suffisants et des textes
lisibles ; ces valeurs le tiennent.

> **Correction du 7 août 2026.** La première version de cet ADR annonçait
> `19,0 : 1` pour `ink-900` sur blanc. Le calcul réel donne **18,88 : 1** :
> l'arithmétique manuelle avait pris la mauvaise branche de la formule WCAG
> (division par 12,92 au lieu de la fonction puissance, le seuil de 0,03928
> n'étant pas atteint). Sans conséquence sur la décision — AAA dans les deux
> cas — mais un document de référence qui porte un chiffre faux coûte plus cher
> que pas de document.
>
> Ces valeurs ne sont plus recopiées à la main : elles sont vérifiées par
> `pnpm --filter @app/ui-tokens check:contrast`, qui **échoue** si une
> modification de la palette casse un seuil. Le garde-fou est né de l'erreur.

### Photographie

Le visuel de marque utilise le **noir et blanc**. C'est un parti pris fort et il
ne se transpose pas ici : les photos de logements doivent être en couleur — un
locataire choisit sur l'aspect réel d'une chambre. Le noir et blanc reste
réservé à la communication de marque.

## Alternatives rejetées

**Orange / terracotta**, proposé par `plan.md` §1.3. Rejetée : cohérent en soi,
mais le fondateur a fourni une identité de marque existante. Une marque déjà
posée prime sur une préférence esthétique.

**Le rouge d'Airbnb.** Rejetée : imite un acteur absent du marché local et
n'apporte aucune reconnaissance à Douala.

**Le concept éditorial sombre.** Rejetée : superbe sur une tablette de
présentation, coûteux en lisibilité sur un écran de téléphone en plein soleil —
condition d'usage réelle de la cible.

## Conséquences

**Positives.** Une seule direction, des contrastes vérifiés par le calcul, une
distinction nette d'avec le concurrent, des jetons centralisés.

**Négatives, assumées.** Le violet profond est peu répandu dans l'immobilier —
distinctif, mais sans code visuel préexistant sur lequel s'appuyer. À
surveiller lors des premiers retours utilisateurs.

## Ce qui doit être confirmé

**Les valeurs hexadécimales ci-dessus sont ma lecture du visuel fourni, pas des
valeurs prélevées.** L'image a été transmise dans la conversation, pas déposée
dans le dépôt : je n'ai pas pu échantillonner les pixels. Elles sont cohérentes
et leurs contrastes sont calculés justes, mais elles ne sont pas certifiées
conformes à la charte XENOS itech.

**Réponse du fondateur, 7 août 2026 : XENOS itech est la structure qui
développe, pas la marque du produit. Le nom commercial du produit n'est pas
encore arrêté.**

Ce que cela change :

- Cette palette est un **point de départ hérité de l'agence**, pas l'identité
  définitive du produit. Elle est valide pour construire — un produit sans
  couleurs arrêtées ne se construit pas — mais elle est explicitement
  **provisoire**.
- Le jour où la marque produit sera définie, `packages/ui-tokens/src/colors.ts`
  est **le seul fichier à modifier**, à condition qu'aucune couleur ne soit
  jamais écrite en dur ailleurs. Cette règle cesse d'être une bonne pratique :
  elle devient la condition pour que le changement de marque coûte une heure au
  lieu d'une semaine. Toute couleur en dur dans le code est un défaut à
  corriger, pas un détail de style.
- Une revue de marque devra trancher si le produit reprend le violet de XENOS
  — cohérence de portefeuille — ou prend sa propre couleur. Les deux se
  défendent ; ce n'est pas une décision technique.

Reste à confirmer : **les valeurs hexadécimales exactes**, si une charte XENOS
existe sous forme de fichier. Celles ci-dessus sont ma lecture du visuel
transmis en conversation — l'image n'étant pas dans le dépôt, je n'ai pas pu
échantillonner ses pixels. Leurs contrastes, eux, sont exacts pour ces
valeurs-là et vérifiés par exécution.

## Artefacts liés

- ADR-003 (`packages/ui-tokens`), CDC §9
- `InspirationsMaquettes/`, `fluxdereservation/`
