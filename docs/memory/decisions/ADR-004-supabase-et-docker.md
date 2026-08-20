# ADR-004 — Supabase pour les services, Docker en local

- **Statut** : Acceptée
- **Date** : 2026-08-07
- **Domaine** : Tech

## Contexte

Question posée par le fondateur : *« que penses-tu de Supabase ? ou alors on
utilise Docker pour gérer tous les services ? »*

**La question contient une fausse alternative, et c'est la première chose à
dire.** Supabase et Docker ne sont pas deux options concurrentes : la CLI
Supabase **démarre toute la pile Supabase dans des conteneurs Docker** sur le
poste de développement. Choisir Supabase, c'est déjà utiliser Docker en local.

La vraie question est : **qui exploite la base, le service d'authentification,
le stockage et les sauvegardes en production — nous, ou un hébergeur ?**

Contexte de l'équipe : une personne, assistée d'agents, qui n'a pas encore
écrit une ligne de code, face à un concurrent déjà en service. Le temps passé à
administrer un serveur est du temps qui ne va pas au produit.

## Décision

| Environnement | Ce qui tourne | Comment |
|---|---|---|
| **Local** | PostgreSQL, Auth, Storage, Realtime, Studio | `supabase start` — conteneurs Docker, Docker 29.4.3 déjà installé sur le poste |
| **Préproduction / Production** | Les mêmes services | Supabase hébergé |

Ce que Supabase apporte, et qui pèse plus que le reste :

1. **La règle de cloisonnement du CDC devient une politique de base de
   données.** Le CDC §9 exige « le propriétaire gère uniquement ses propres
   logements ». Avec RLS, cette règle est appliquée par PostgreSQL lui-même —
   pas par un intercepteur qu'on peut oublier d'appeler sur une nouvelle route.
   C'est une différence de nature, pas de confort : une faille d'autorisation
   devient structurellement plus difficile.
2. **C'est du PostgreSQL nu.** Donc les contraintes d'exclusion sur les
   intervalles de dates — la réponse correcte à la lacune CDC-02 — fonctionnent
   nativement. Deux réservations simultanées sur les mêmes dates : la base
   tranche, la seconde reçoit une erreur. Aucune logique applicative ne peut
   produire cette garantie de façon fiable.
3. **Une seule session d'authentification pour le web et le mobile**, les deux
   clients étant officiellement supportés.
4. **Le stockage des photos remplace Cloudinary** prévu au CDC : un fournisseur
   de moins, une clé d'API de moins.

`psql` n'est pas installé sur le poste — sans importance, la CLI Supabase
fournit l'accès à la base.

## Alternatives rejetées

**Tout auto-héberger avec Docker Compose** (PostgreSQL + un service d'auth +
MinIO + les sauvegardes, sur un VPS). Rejetée : contrôle total et coût serveur
faible, mais l'exploitation — sauvegardes testées, restaurations,
supervision, mises à jour de sécurité — est un travail permanent que personne
n'assure aujourd'hui. Une sauvegarde qu'on n'a jamais restaurée n'est pas une
sauvegarde. Reste ouverte si les coûts ou la latence l'imposent : le contenu
étant du PostgreSQL standard, la sortie est possible.

**Neon + Drizzle + Better Auth**, comme le proposait `plan.md` §4.4. Rejetée :
bon choix en soi, mais impose d'assembler trois briques et d'écrire soi-même
l'autorisation, là où RLS la place dans la base. Trois fournisseurs au lieu
d'un.

**Firebase.** Rejetée : pas de PostgreSQL, donc ni contrainte d'exclusion sur
les dates, ni requêtes relationnelles sur les filtres de recherche. Le modèle
du CDC §7 est relationnel de bout en bout.

## Conséquences

**Positives.** Base, authentification, stockage et temps réel opérationnels dès
le premier jour. Parité stricte entre le poste et la production, puisque c'est
la même pile. L'autorisation est testable en SQL.

**Négatives, assumées.**

- Dépendance à un fournisseur sur l'authentification et le stockage. Atténuée,
  pas nulle : les données sont dans PostgreSQL, le reste est ré-implémentable.
- RLS est puissant et **piégeux** : une politique mal écrite ouvre les données
  au lieu de les fermer. Conséquence directe : **chaque politique RLS doit être
  accompagnée d'un test qui vérifie le refus**, pas seulement l'autorisation.
  Cette règle entre dans la définition de « terminé ».
- Docker doit tourner sur le poste pour développer.

## Mesure de latence — faite le 7 août 2026, depuis le Cameroun

**Mesurée, plus supposée.** Aller-retour TCP depuis le poste du fondateur, au
Cameroun, meilleur de 3 tirs par cible.

| Cible | Aller-retour TCP | Requête complète |
|---|---|---|
| AWS Virginie (`us-east-1`) | **218 ms** | 656 ms |
| AWS Londres (`eu-west-2`) | 228 ms | 1952 ms |
| **AWS Paris (`eu-west-3`)** | **245 ms** | 715 ms |
| **AWS Francfort (`eu-central-1`)** | **246 ms** | 722 ms |
| AWS Irlande (`eu-west-1`) | 279 ms | 878 ms |
| AWS Le Cap (`af-south-1`) | **284 ms** | 841 ms |
| **API OpenAI** | **61 ms** | 510 ms |

### Trois enseignements, dont un qui change l'architecture

**1. Il n'y a pas d'avantage africain.** Le Cap est la région la **plus lente**
des six (284 ms), plus lente que Paris ou Francfort. Le trafic depuis le
Cameroun remonte vers l'Europe quoi qu'il arrive. Choisir une région africaine
« parce qu'elle est plus proche » aurait été une erreur fondée sur la
géographie plutôt que sur le routage.

**2. Toute base est à ~250 ms, et c'est structurant.** L'écart entre régions
(218 à 284 ms) est faible et dans le bruit d'une connexion variable. Ce qui
compte n'est pas *quelle* région, mais que **chaque aller-retour vers la base
coûte un quart de seconde**. Un écran qui enchaîne trois requêtes
séquentielles dépense 750 ms en réseau pur, avant tout traitement.

> **Conséquence directe sur ADR-003.** Le schéma « l'application mobile
> interroge Supabase directement » fait payer 250 ms **par requête** depuis
> l'appareil. Il est écarté pour tout ce qui demande plus d'une requête.
>
> **Règle d'architecture retenue** : le serveur Next.js est déployé **dans la
> même région que la base**. Le client — web ou mobile — fait *un* aller-retour
> vers ce serveur, qui enchaîne ses requêtes en local à coût quasi nul. Le
> client paie une fois 250 ms, pas N fois.
>
> L'accès direct à Supabase depuis le client reste acceptable pour les lectures
> unitaires triviales, jamais pour composer un écran.

**3. L'API OpenAI est à 61 ms — le réseau ne sera pas le goulot de l'agent.**
Quatre fois plus rapide que n'importe quelle région de base, très probablement
grâce à un point de présence proche. La cible « premier mot affiché en moins de
3 s » du PRD (S5) est donc jouable : ce sera le temps de génération du modèle
qui dominera, pas le transport.

**Réserve honnête.** Ces chiffres viennent d'une connexion, un jour, en
meilleur de trois. Ils suffisent à écarter Le Cap et à établir l'ordre de
grandeur — ils ne suffisent pas à départager Paris de Francfort. **Région
retenue : Paris (`eu-west-3`)**, pour la latence et pour la juridiction
européenne des données ; à confirmer sur un projet réel.

## Ce qui doit encore être vérifié

| À vérifier | Pourquoi c'est bloquant | Quand |
|---|---|---|
| ~~Latence depuis Douala~~ | **Fait le 7 août 2026, voir ci-dessus** | — |
| ~~`btree_gist` activable~~ | **Fait.** `create extension btree_gist` réussit sur PostgreSQL 16, et la contrainte d'exclusion refuse bien les chevauchements — 4 tests dans `supabase/tests/03_rls_refusals.sql`, tous verts. **Réserve** : vérifié sur une image `postgres:16-alpine`, pas encore sur Supabase hébergé | À reconfirmer sur le projet réel |
| Paris (`eu-west-3`) est-il proposé par Supabase ? | Sinon, repli sur Francfort — écart mesuré : 1 ms | À la création du projet |
| Coût réel au-delà du palier gratuit | Aucun budget n'existe encore dans le projet | Avant la mise en production |
| Transformation d'images incluse ou payante | Le CDC exige des images optimisées en WebP pour la 3G. Si la transformation est payante, il faut la faire au téléversement. | Avant le sprint « photos de logements » |
| Extension `btree_gist` activable | Conditionne la contrainte d'exclusion sur les dates. **Sans elle, la garantie anti-double-réservation n'existe pas.** | Au premier jet de schéma |

Tant que ces quatre points ne sont pas vérifiés par une mesure réelle, cet ADR
reste **accepté mais non verrouillé**.

## Artefacts liés

- ADR-003 (monorepo), CDC §7 §8 §9
- Skills : `tech/choose_tech_stack`, `tech/propose_architecture`
