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

## Ce qui doit être vérifié avant de verrouiller ce choix

Ces points sont des **hypothèses**, pas des constats. Aucun accès externe n'a
été utilisé pour les établir.

| À vérifier | Pourquoi c'est bloquant | Quand |
|---|---|---|
| Régions disponibles et **latence réelle mesurée depuis Douala** | Sur une connexion 3G camerounaise, un aller-retour vers l'Europe s'ajoute à chaque requête. Si la latence est rédhibitoire, c'est tout l'ADR qui tombe. | Avant le premier écran connecté à la base |
| Coût réel au-delà du palier gratuit | Aucun budget n'existe encore dans le projet | Avant la mise en production |
| Transformation d'images incluse ou payante | Le CDC exige des images optimisées en WebP pour la 3G. Si la transformation est payante, il faut la faire au téléversement. | Avant le sprint « photos de logements » |
| Extension `btree_gist` activable | Conditionne la contrainte d'exclusion sur les dates. **Sans elle, la garantie anti-double-réservation n'existe pas.** | Au premier jet de schéma |

Tant que ces quatre points ne sont pas vérifiés par une mesure réelle, cet ADR
reste **accepté mais non verrouillé**.

## Artefacts liés

- ADR-003 (monorepo), CDC §7 §8 §9
- Skills : `tech/choose_tech_stack`, `tech/propose_architecture`
