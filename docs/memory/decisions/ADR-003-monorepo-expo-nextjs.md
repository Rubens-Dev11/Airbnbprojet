# ADR-003 — Monorepo pnpm : Expo (iOS/Android) + Next.js (web) + paquets partagés

- **Statut** : Acceptée
- **Date** : 2026-08-07
- **Domaine** : Tech
- **Remplace** : l'arbitrage ouvert D-03 de `docs/decisions.md`

## Contexte

Le fondateur a levé la contrainte bloquante : **la stack du CDC n'est pas
imposée**. Il a ajouté une exigence produit nouvelle : *« j'ai même envie qu'on
fasse du React Native pour avoir les versions mobile iOS et Android en même
temps »*.

Cela change le problème. On ne choisit plus entre deux architectures web, on
doit servir **trois cibles** — web, iOS, Android — avec une équipe d'une
personne assistée d'agents. Le partage de code n'est plus un confort, c'est la
condition de survie du projet.

Contraintes retenues :

- 80 % des utilisateurs sur mobile, en 3G variable (CDC §9).
- Le concurrent PUOL est **une application mobile**. Le web reste néanmoins le
  seul canal indexable par un moteur de recherche : « chambre meublée Douala »
  ne se cherche pas dans un store.
- La console propriétaire et l'administration se travaillent mal sur un écran
  de 5 pouces.
- La clé OpenAI ne doit jamais quitter le serveur (CDC §8.2).

## Décision

Monorepo **pnpm workspaces**, avec une répartition par **audience**, pas par
technologie :

```
apps/
  mobile/     Expo (React Native) — iOS + Android
              Audience : le locataire. Recherche, chat IA, réservation,
              favoris, voyages.
  web/        Next.js (App Router)
              Audiences : le visiteur non connecté (pages publiques
              indexables), le propriétaire (console), l'administrateur.
              Porte aussi l'API serveur : agent IA, webhooks, règles
              métier que la base ne peut pas exprimer seule.
packages/
  shared/     Types, schémas de validation Zod, client d'API, logique
              métier pure. Zéro dépendance UI.
  ui-tokens/  Jetons de design : couleurs, espacements, typographie.
              Source unique consommée par Tailwind (web) et NativeWind
              (mobile).
supabase/     Migrations SQL, politiques RLS, configuration locale.
docs/
agent-skills/
```

**Le point clé, et c'est ce qui rend la décision tenable** : les écrans ne sont
pas dupliqués, parce que les audiences ne se recouvrent pas. L'application
mobile sert le locataire. Le web sert le référencement, le propriétaire et
l'administrateur. Seule la fiche logement existe des deux côtés — c'est le prix
à payer, et il est connu d'avance.

**Style** : Tailwind sur le web, **NativeWind** sur mobile. Même syntaxe, même
modèle mental, jetons partagés depuis `packages/ui-tokens`. Sur le web,
shadcn/ui pour la console propriétaire et l'administration — des tableaux et
des formulaires accessibles, écrits une fois.

**Agent IA** : une route serveur Next.js avec le SDK IA de Vercel
(`streamText` + outils). Le mobile appelle ce même point d'entrée HTTP. Un seul
endroit détient la clé, un seul endroit définit les outils
(`search_rooms`, `check_availability`, `create_booking_draft`…).

## Alternatives rejetées

**Expo seul, avec `react-native-web` pour le web.** Rejetée. Une seule base de
code, très séduisant — mais le rendu serveur et l'indexation d'une place de
marché y sont nettement plus faibles qu'avec Next.js. Le référencement est le
seul canal d'acquisition gratuit face à un concurrent déjà installé. À
reconsidérer si la console propriétaire migre un jour sur mobile.

**Next.js seul, en PWA.** Rejetée : le fondateur demande explicitement iOS et
Android. Une PWA sur iOS reste bridée, et l'absence de présence dans les stores
est un handicap de crédibilité face à un concurrent qui y est.

**Deux dépôts séparés.** Rejetée : deux historiques à synchroniser pour livrer
une seule fonctionnalité, et aucune garantie que les types restent alignés.

**Next.js + NestJS séparés (CDC §6).** Rejetée maintenant que la contrainte est
levée : deux déploiements, du CORS et une double couche d'authentification pour
50 à 100 sessions simultanées. Le découplage s'achète quand la charge le paie,
pas avant. Réversible : la logique métier vit dans `packages/shared`, elle
pourra être extraite dans un service dédié sans réécriture.

## Conséquences

**Positives.** iOS et Android depuis une base de code. Types partagés de bout en
bout, donc les régressions de contrat d'API se voient à la compilation. Un seul
`pnpm install`, un seul pipeline.

**Négatives, assumées.**

- Un monorepo avec Expo demande une configuration soignée (résolution de
  modules, `metro.config.js`). C'est une journée de mise en place, à prévoir.
- La fiche logement sera écrite deux fois côté interface.
- Publier sur l'App Store et le Play Store suppose des comptes développeurs
  payants et des délais de validation. **Non chiffré à ce jour.**

## Ce qui reste ouvert

- **Le nom commercial du produit.** Il détermine les identifiants
  d'application iOS et Android, qui sont **définitifs après la première
  publication en store**. Aujourd'hui le renommage est gratuit ; après
  publication, il ne l'est plus. Décision du fondateur attendue avant la
  création de `apps/mobile`.
- **La version de Node à épingler** : le poste est en v24.14.1. À figer dans
  `.nvmrc` et dans le champ `engines`, après vérification de la compatibilité
  réelle avec Expo.

## Artefacts liés

- ADR-004 (services), ADR-005 (agent IA), ADR-006 (identité visuelle)
- Skills : `tech/choose_tech_stack`, `tech/propose_architecture`
