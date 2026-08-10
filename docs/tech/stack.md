# Stack technique

Artefact du skill `tech/choose_tech_stack`. Chemin conforme à ADR-002
(`tech/stack.md` → `docs/tech/stack.md`).

Les décisions structurantes sont dans les ADR — ce document les rassemble et
ajoute les conventions. En cas de contradiction, **l'ADR fait foi**.

---

## 1. Choix par couche

| Couche | Retenu | Alternatives écartées | Pourquoi ce choix |
|---|---|---|---|
| Dépôt | Monorepo **pnpm workspaces** | Dépôts séparés, dossiers indépendants | Types partagés de bout en bout ; une régression de contrat d'API se voit à la compilation (ADR-003) |
| Mobile | **Expo / React Native** — iOS + Android | PWA, natif séparé | Exigence du fondateur, une base de code pour deux plateformes (ADR-003) |
| Web | **Next.js** App Router | Expo Web seul | Rendu serveur et indexation — seul canal d'acquisition gratuit face à un concurrent installé (ADR-003) |
| API serveur | **Routes serveur Next.js** | NestJS séparé, fonctions Edge Deno | Un seul endroit détient la clé OpenAI et définit les outils de l'agent ; réversible car la logique vit dans `packages/shared` (ADR-003) |
| Base de données | **PostgreSQL via Supabase** | Neon, PostgreSQL auto-hébergé, Firebase | Contraintes d'exclusion sur intervalles de dates, RLS, relationnel (ADR-004) |
| Authentification | **Supabase Auth** | Better Auth, JWT maison | Une session pour le web et le mobile ; l'autorisation descend dans la base (ADR-004) |
| Autorisation | **RLS PostgreSQL** | Intercepteurs applicatifs | Une route oubliée ne peut pas contourner une politique de base (ADR-004) |
| Stockage photos | **Supabase Storage** | Cloudinary (prévu au CDC) | Un fournisseur et une clé de moins (ADR-004) |
| IA | **OpenAI, appels d'outils, en flux** | — | Prescrit par le CDC §5.3, confirmé par ADR-005 |
| Style web | **Tailwind** + shadcn/ui | CSS modules | shadcn pour les tableaux et formulaires accessibles de la console et de l'administration |
| Style mobile | **NativeWind** | StyleSheet, Tamagui | Même syntaxe que le web, jetons partagés, faible verrouillage |
| Validation | **Zod**, dans `packages/shared` | class-validator (CDC), Yup | Un schéma sert à la fois de validation serveur et de type TypeScript |
| Développement local | **Docker**, via la CLI Supabase | Services installés à la main | Parité stricte avec la production (ADR-004) |

## 2. Ce qui n'est pas encore choisi

Rien ne sera écrit ici sans vérification — les lacunes sont préférables aux
valeurs plausibles.

| Sujet | État |
|---|---|
| Agrégateur Mobile Money | `plan.md` propose NotchPay, puis CinetPay. **Existence, tarifs, KYC et délais non vérifiés** (ADR-007) |
| Fournisseur SMS pour l'OTP | Aucun candidat, ni au CDC ni dans `plan.md` |
| Hébergement du web | Non tranché — dépend de la mesure de latence depuis Douala (ADR-004) |
| Distribution mobile | Comptes développeurs Apple et Google : coûts et délais **non chiffrés** |
| Supervision, erreurs | Non traité |
| Intégration continue | Non traité |

## 3. Versions

Vérifiées par exécution sur le poste de référence, le 7 août 2026 :

| Outil | Version constatée |
|---|---|
| Node.js | v24.14.1 |
| pnpm | 10.33.0 |
| Docker | 29.4.3 |
| npm | 11.11.0 |

**Aucune version de framework n'est indiquée ici.** Elles seront relevées à
l'installation réelle et consignées à ce moment-là. Écrire aujourd'hui « Expo
SDK 5x » ou « Next.js 1x » serait afficher une information non vérifiée.

Deux points à trancher au moment du squelette :

- **Version de Node à épingler** dans `.nvmrc` et `engines`. Le poste est en
  v24 ; la compatibilité réelle avec Expo n'a pas été vérifiée. Si elle pose
  problème, on épingle une version antérieure — le poste n'impose rien.
- **Fichier de verrouillage commité**, et installation en mode strict en
  intégration continue. Une dépendance ajoutée sans mise à jour du verrou casse
  le build.

## 4. Conventions

Tous les agents et contributeurs s'y tiennent.

**TypeScript**

- `strict: true`, sans exception. Pas de `any` implicite.
- Les types partagés vivent dans `packages/shared`. Un type dupliqué entre le
  web et le mobile est un bug en attente.
- Les schémas Zod sont la source : le type TypeScript en est déduit, jamais
  l'inverse.

**Base de données**

- Toute modification de schéma passe par une migration versionnée dans
  `supabase/migrations/`. Jamais de changement appliqué à la main.
- **Toute politique RLS est accompagnée d'un test qui vérifie le refus**, pas
  seulement l'autorisation. Une politique qui n'a jamais bloqué personne n'a
  jamais été testée (ADR-004).
- Les montants sont des entiers en FCFA. Le franc CFA n'a pas de décimales — un
  flottant y est une erreur, pas une approximation.

**Langue**

- Documentation, ADR, messages de commit : français.
- Code, noms de variables, noms de tables et de colonnes : **anglais**. Le CDC
  §7 emploie des noms français (`prix_nuit`, `date_debut`) ; ils seront
  traduits. Motif : tout l'écosystème autour du code est anglophone, et un
  schéma moitié français moitié anglais se paie pendant des années. **Écart
  assumé par rapport au CDC, consigné ici.**

**Secrets**

- Aucune clé dans le code. `.env` est ignoré, `.env.example` porte les **noms**
  des clés, jamais les valeurs.
- La clé OpenAI ne quitte jamais le serveur. Le mobile appelle une route, pas
  l'API du fournisseur.

**Nommage des fichiers**

- Composants : `PascalCase.tsx`. Reste : `kebab-case.ts`.
- Un dossier par domaine métier, pas par type technique.

## 5. Arborescence cible

```
apps/
  mobile/          Expo — iOS + Android, audience locataire
  web/             Next.js — pages publiques indexables, console
                   propriétaire, administration, API serveur
packages/
  shared/          Types, schémas Zod, client d'API, logique métier pure
  ui-tokens/       Jetons de design (ADR-006) — source unique des couleurs
supabase/
  migrations/      VERSIONNÉ, jamais ignoré
  config.toml
docs/              Documentation, y compris les artefacts des skills (ADR-002)
agent-skills/      Instructions des agents
```
