# PRD — Plateforme de réservation de chambres meublées à Douala

- **Version** : 1.0
- **Date** : 7 août 2026
- **Statut** : source de vérité produit ([ADR-001](../memory/decisions/ADR-001-prd-source-de-verite-unique.md))
- **Nom commercial** : non arrêté

> **Ce document prime sur tout artefact antérieur en cas de conflit.** Le CDC
> v2.0 et `plan.md` sont des documents d'entrée : ils gardent leur valeur de
> contexte, ils ne pilotent plus le développement. Toute évolution de périmètre
> passe par une nouvelle version de ce document, avec entrée au changelog.

---

## 1. Résumé exécutif

Le marché des chambres meublées à Douala est réel, actif et **déjà servi** : le
concurrent PUOL est en production, avec catalogue, réservation, avance en ligne
et programme de parrainage. Le CDC affirmait l'inverse ; c'est faux et corrigé.

Nous n'entrons donc pas sur un marché vide. Nous entrons avec **un seul
différenciateur assumé : la réservation par conversation.** Là où tout le monde
propose des filtres ou un fil d'annonces, l'utilisateur écrit *« je cherche un
studio climatisé à Akwa pour ce week-end, 20 000 max »* et l'agent cherche,
compare, vérifie la disponibilité et amorce la réservation.

**Le MVP a un seul travail : établir si cette hypothèse tient.** Il n'a pas pour
mission de gagner de l'argent, ni de couvrir le CDC. Tout ce qui ne sert pas à
tester l'hypothèse est reporté, et la liste des reports est explicite en §7.

Trois arbitrages structurants sont rendus ici, et ils réduisent fortement le
périmètre par rapport au CDC comme à `plan.md` :

1. **L'encaissement de l'avance est manuel au MVP.** Pas d'agrégateur, pas de
   webhooks, pas de KYC. Le parcours de paiement est réel et testé ; c'est son
   automatisation qui attend.
2. **Il n'y a pas de messagerie interne.** Après confirmation de l'avance, le
   numéro WhatsApp de l'hôte est révélé. C'est le canal réel de Douala ; le
   reconstruire serait payer pour être moins bon.
3. **Les propriétaires ne créent pas leurs annonces au MVP.** L'équipe les saisit
   pour eux — ce qu'il faudra faire de toute façon pour amorcer le catalogue.

---

## 2. Problème et cible

### 2.1 Le problème

À Douala, trouver une chambre meublée passe par WhatsApp, Facebook Marketplace
et le bouche-à-oreille. Aucune centralisation, des photos absentes ou
trompeuses, aucune réservation en ligne, et des arnaques fréquentes (CDC §1).

Ce que **nous** ajoutons au constat du CDC, après observation directe de la
concurrence : le problème « il n'existe aucun outil » n'est plus vrai. Le
problème restant est **la friction de la recherche**. Un catalogue avec filtres
suppose que l'utilisateur sache traduire son besoin en critères. Or un besoin se
formule en langage naturel : *« pas trop loin de Bonanjo, calme, pour deux
semaines, avec la clim »*.

### 2.2 Cibles

| Segment | Besoin | Fréquence | Capacité de paiement |
|---|---|---|---|
| **Voyageur d'affaires camerounais** — cible primaire du MVP | Séjour de 2 à 10 nuits, quartier proche de son rendez-vous, confort minimum garanti | Plusieurs fois par an | Bonne, paie volontiers pour la fiabilité |
| **Diaspora en visite** | Séjour de 1 à 4 semaines, veut réserver **avant** d'arriver, sans réseau local | 1 à 2 fois par an | Bonne, souvent en devises |
| **Nouvel arrivant à Douala** | Meublé de transition, 1 à 3 mois, le temps de trouver un logement long | Une fois, mais forte valeur | Variable |
| **Propriétaire de meublé** | Visibilité, réservations garanties, moins de temps perdu au téléphone | Continu | — |

**Hypothèse non vérifiée, à signaler** : cette segmentation est déduite du CDC
et du contexte, **pas d'entretiens utilisateurs**. Aucun entretien n'a été
conduit. Le premier chantier de la Phase 0 doit la confronter au réel.

### 2.3 Ce qu'on sait de la concurrence

Constaté directement (voir `docs/veille-concurrence.md`) : PUOL propose un fil
vidéo vertical, des annonces vérifiées, une avance non remboursable avec solde
à l'arrivée, des favoris, une messagerie et un programme d'ambassadeurs.

**Non vérifié** : son volume d'annonces, sa couverture, s'il a du Mobile Money,
s'il a une IA. Affirmer qu'il n'en a pas serait refaire l'erreur du CDC §2.

---

## 3. Hypothèse principale et critères de succès

### 3.1 L'hypothèse que le MVP doit valider

> **Un utilisateur cherchant une chambre meublée à Douala préfère décrire son
> besoin en une phrase plutôt que de remplir des filtres — et il va jusqu'à la
> réservation par ce canal.**

Si elle est fausse, le produit n'a pas de différenciateur et il faut pivoter,
pas ajouter des fonctionnalités.

### 3.2 Critères de succès du MVP

Mesurés sur 30 jours après ouverture publique.

| # | Critère | Cible | Pourquoi ce seuil |
|---|---|---|---|
| S1 | Part des réservations **initiées via l'agent** | **≥ 40 %** | En dessous, la conversation est un gadget et non le produit. Indicateur imposé par [ADR-005](../memory/decisions/ADR-005-agent-ia-canal-principal.md) |
| S2 | Réservations menées jusqu'à l'avance payée | **≥ 10** | En dessous, l'échantillon ne permet aucune conclusion |
| S3 | Requêtes en langage naturel produisant un résultat pertinent | **≥ 80 %** | Mesuré sur un échantillon de conversations réelles, relues à la main |
| S4 | Annonces réelles en ligne à l'ouverture | **≥ 30** | Une place de marché vide ne convertit personne |
| S5 | Délai de réponse de l'agent, perçu | **< 3 s** avant le premier mot affiché | Reprend le CDC §8.3. **À mesurer depuis une connexion camerounaise, pas depuis le poste de développement** |

S1 est le seul qui décide de la suite. Les autres conditionnent sa validité.

---

## 4. Périmètre du MVP

### 4.1 Le parcours critique

C'est le seul parcours que le MVP doit servir sans faille :

```
1. L'utilisateur arrive (web indexé, ou application)
2. Il décrit son besoin en langage naturel à l'agent
   └─ ou parcourt le catalogue, canal secondaire
3. L'agent propose des logements réellement disponibles aux dates voulues
4. Il ouvre une fiche : photos, quartier, équipements, prix
5. Il demande à réserver : dates + message
6. Il crée son compte, s'il ne l'a pas déjà
   └─ le parcours ne casse pas : retour au point exact après connexion
7. Le propriétaire accepte ou refuse, sous 24 h
8. Accepté → l'utilisateur reçoit les instructions de paiement de l'avance
9. Il paie par Mobile Money, saisit la référence de la transaction
10. L'équipe confirme la réception → les dates sont bloquées
11. Le contact WhatsApp de l'hôte est révélé
```

Toute fonctionnalité qui, retirée, ne casse pas cette chaîne est **hors MVP**.

### 4.2 Dans le MVP

| Domaine | Contenu |
|---|---|
| **Agent conversationnel** | Recherche par appels d'outils (`search_listings`, `get_listing`, `check_availability`, `start_booking`), en flux, mémoire de session, français. Accessible **sans compte** — un visiteur peut chercher |
| **Catalogue** | Fil d'annonces, fiche logement avec galerie, référentiel des quartiers de Douala |
| **Recherche classique** | Quartier, fourchette de prix, dates, type. Canal secondaire, mais présent |
| **Compte** | Email + mot de passe. Rôles `LOCATAIRE`, `PROPRIETAIRE`, `ADMIN` |
| **Réservation** | Demande → acceptation sous 24 h → expiration automatique sinon → blocage des dates par contrainte de base |
| **Avance** | Instructions Mobile Money, saisie de la référence par le locataire, **confirmation manuelle en administration** |
| **Révélation du contact** | Numéro WhatsApp de l'hôte affiché **après** confirmation de l'avance, jamais avant |
| **Espace propriétaire** | Voir ses logements, traiter les demandes (accepter / refuser), calendrier de blocage manuel |
| **Administration** | Créer et modifier les annonces, valider les propriétaires, confirmer les paiements, vue des réservations |
| **Web public indexable** | Accueil, recherche, fiche logement, pages par quartier — rendu serveur |

### 4.3 Hors MVP, et pourquoi

| Écarté | Motif | Cible |
|---|---|---|
| **Agrégateur de paiement automatique** | Intégration + KYC + webhooks + réconciliation ne testent pas l'hypothèse. Et aucun prestataire n'est vérifié à ce jour | Phase 2 |
| **Messagerie interne** | WhatsApp est le canal réel de Douala. Le reconstruire coûte cher pour un résultat inférieur. La désintermédiation est bloquée par le moment de la révélation, pas par le canal | Non planifiée |
| **Création d'annonce par le propriétaire** | L'amorçage impose de saisir les 30 à 50 premières annonces nous-mêmes. Construire l'outil avant d'avoir des propriétaires autonomes, c'est construire à l'aveugle | Phase 2 |
| **OTP par SMS** | Coût par message, intégration opérateur, friction à l'inscription. Aucun fournisseur identifié ni au CDC ni dans `plan.md` | Phase 2 |
| **Avis et notation** | Ne casse pas le parcours critique. Sans volume, un système d'avis affiche des pages vides | Phase 2 |
| **Carte interactive** | Confort réel, mais le quartier suffit à décider à Douala | Phase 2 |
| **Notifications WhatsApp automatiques** | Traitées à la main sur les premiers volumes | Phase 2 |
| **Fil vidéo** | Le format de PUOL. Suppose des vidéos que nous n'avons pas | À réévaluer |
| **Assistant vocal, application native au-delà d'Expo, multi-villes, multi-agences** | Hors sujet au stade de la validation | Phase 3+ |

### 4.4 Décision : pourquoi l'avance est encaissée à la main

C'est l'arbitrage le plus contestable de ce document, donc le plus argumenté.

`plan.md` §4.2 place le paiement automatisé dans le MVP, avec un argument
solide : sans encaissement, pas de revenu et rien n'empêche de traiter hors
plateforme.

**L'argument est juste sur le fond mais confond deux choses** : *encaisser* et
*automatiser l'encaissement*. Le MVP encaisse réellement — le locataire paie une
avance, elle est vérifiée, les dates sont bloquées, le contact est révélé.
Seule l'automatisation est reportée.

Ce que cela permet :

- Le parcours de paiement est **testé en conditions réelles** dès le MVP. On
  apprend le taux d'abandon devant l'avance, qui est l'information la plus chère
  du projet — et personne ne l'a.
- Aucune dépendance à un prestataire dont **ni l'existence, ni les tarifs, ni
  les délais ne sont vérifiés** ([ADR-007](../memory/decisions/ADR-007-modele-economique-avance-en-ligne.md)).
- À 10 réservations sur 30 jours, une confirmation manuelle coûte quelques
  minutes par jour.

**Ce que cela coûte, et qui doit être dit** :

- Ça ne passe pas l'échelle. Au-delà d'environ 5 réservations par jour, c'est
  intenable. C'est le seuil qui déclenche la Phase 2.
- Recevoir des fonds sur un compte Mobile Money personnel pose une question
  juridique et fiscale réelle. **Elle n'est traitée nulle part** — ni au CDC, ni
  dans `plan.md`, ni ici. À instruire avant l'ouverture publique, pas après.
- La confirmation manuelle introduit un délai entre le paiement et le blocage
  des dates. Le locataire doit en être informé explicitement à l'écran.

---

## 5. User stories

Format imposé par le skill `product/create_user_stories`. États vides,
chargement et erreurs sont exigés partout — ils ne sont détaillés que là où ils
portent une règle métier.

### Epic A — Découverte par la conversation

**US-001 — Chercher en langage naturel**
En tant que visiteur, je veux décrire mon besoin en une phrase afin d'obtenir
des logements pertinents sans remplir de formulaire.
- Given des annonces existent, When j'écris « studio climatisé à Akwa, moins de
  25 000 la nuit, du 12 au 15 », Then l'agent retourne les logements
  correspondants **et réellement disponibles à ces dates**.
- Given aucun logement ne correspond exactement, When la recherche aboutit à
  zéro, Then l'agent propose des alternatives en énonçant le critère qu'il a
  relâché.
- Given je ne suis pas connecté, When j'utilise l'agent, Then il fonctionne :
  la conversation ne demande pas de compte.
- Given l'API du modèle est indisponible, When j'envoie un message, Then un
  message d'erreur explicite s'affiche et la recherche classique est proposée.
  **Jamais de résultat inventé.**

**US-002 — Voir la réponse s'afficher progressivement**
En tant qu'utilisateur sur connexion lente, je veux voir la réponse arriver mot
à mot afin de savoir que le système travaille.
- Given une connexion 3G, When l'agent répond, Then le premier mot s'affiche en
  moins de 3 secondes.

**US-003 — Retrouver le fil de ma conversation**
- Given j'ai déjà échangé, When je reviens, Then l'agent se souvient du contexte
  de la session.

### Epic B — Catalogue

**US-004 — Parcourir les logements** · **US-005 — Filtrer** (quartier, prix,
dates, type) · **US-006 — Consulter une fiche** (galerie, équipements, quartier,
prix, prix total calculé pour mes dates).

**US-006** porte une règle : le **contact de l'hôte n'est jamais affiché** sur
la fiche, quel que soit l'état de connexion.

### Epic C — Compte

**US-007 — Créer un compte** (email, mot de passe, téléphone camerounais
déclaratif) · **US-008 — Me connecter sans perdre ma réservation en cours**
- Given je remplis une demande sans être connecté, When on me demande de me
  connecter, Then après connexion je reviens **exactement** à ma demande, dates
  et message conservés.

### Epic D — Réservation

**US-009 — Demander une réservation**
- Given des dates disponibles, When je soumets, Then une demande `EN_ATTENTE`
  est créée et le propriétaire est notifié.
- Given deux demandes simultanées sur les mêmes dates, When les deux sont
  acceptées, Then **la base refuse la seconde** et son auteur reçoit une erreur
  explicite. La garantie vient de la contrainte d'exclusion, pas du code
  applicatif.
- Given des dates passées ou une sortie avant l'entrée, When je soumets, Then la
  demande est refusée avec un message clair.

**US-010 — Accepter ou refuser** (propriétaire)
- Given une demande, When je n'ai pas répondu sous 24 h, Then elle expire
  automatiquement et le locataire est prévenu.
- Given une demande sur le logement d'un autre propriétaire, When j'essaie d'y
  accéder, Then l'accès est refusé **par la base de données**.

**US-011 — Payer l'avance**
- Given ma demande est acceptée, When j'ouvre le paiement, Then j'obtiens le
  montant de l'avance, le numéro Mobile Money et une **référence unique** à
  reporter.
- Given j'ai payé, When je saisis la référence, Then le statut passe à
  `AVANCE_DECLAREE` et l'écran indique explicitement qu'une vérification
  manuelle est en cours, avec un délai annoncé.

**US-012 — Confirmer un paiement** (administrateur)
- Given une avance déclarée, When je la confirme, Then les dates sont bloquées,
  le statut passe à `CONFIRMEE` et le contact WhatsApp de l'hôte est révélé au
  locataire.
- Given je ne retrouve pas la transaction, When je rejette, Then le locataire
  est prévenu et les dates sont libérées.

**US-013 — Suivre mes réservations** — historique et statut.

### Epic E — Propriétaire et administration

**US-014** — voir mes logements · **US-015** — bloquer des dates manuellement ·
**US-016** (admin) — créer et modifier une annonce, téléverser les photos ·
**US-017** (admin) — valider un propriétaire · **US-018** (admin) — vue de
toutes les réservations.

### Epic F — Web public

**US-019 — Trouver la plateforme depuis un moteur de recherche**
- Given une recherche du type « chambre meublée Akwa Douala », When la page
  quartier existe, Then elle est rendue côté serveur et indexable.

---

## 6. Modèle de données

Entités du MVP uniquement. Les montants sont des **entiers en FCFA** — le franc
CFA n'a pas de décimales.

| Entité | Rôle | Points d'attention |
|---|---|---|
| `profiles` | Prolonge le compte d'authentification : rôle, nom, téléphone, photo | **`role` ne contient pas `VISITEUR`** : un visiteur non connecté n'a pas de ligne. Corrige la contradiction CDC-01 |
| `listings` | Annonce : titre, description, quartier, adresse, prix/nuit, type, équipements, photos, actif | Index sur `quartier` et `price_per_night` |
| `listing_blocks` | Périodes indisponibles, **par plage de dates** | Corrige la lacune CDC-02 : un booléen ne représente pas un calendrier |
| `bookings` | Demande : locataire, logement, dates, montants, statut, message | **Contrainte d'exclusion** sur `(listing_id, période)` pour les statuts bloquants. Exige `btree_gist` |
| `payments` | Avance : réservation, méthode, référence saisie, montant, statut, qui a confirmé et quand | Statut jamais modifié sans trace de l'agent qui l'a changé |
| `chat_sessions` / `chat_messages` | Conversation, **une ligne par message** | Pas de tableau JSON unique : croissance non bornée et aucune indexation possible |

**Statuts de réservation** :
`EN_ATTENTE → ACCEPTEE → AVANCE_DECLAREE → CONFIRMEE → TERMINEE`
avec sorties `REFUSEE`, `EXPIREE` (24 h sans réponse), `ANNULEE`.
Seuls `CONFIRMEE` et `TERMINEE` bloquent les dates.

**Autorisation** : chaque règle d'accès est une politique RLS, et **chaque
politique est accompagnée d'un test qui vérifie le refus**, pas seulement
l'autorisation ([ADR-004](../memory/decisions/ADR-004-supabase-et-docker.md)).

---

## 7. Exigences du CDC reportées hors MVP

Exigé par le skill `generate_prd` : ne rien faire disparaître en silence.

| Exigence CDC | Sort | Motif |
|---|---|---|
| §3 — Paiement Mobile Money automatisé | Phase 2 | §4.4 ci-dessus |
| §4 — Rôle `VISITEUR` en base | **Supprimé** | Contradiction interne, corrigée en §6 |
| §4 — Messagerie locataire ↔ propriétaire | **Abandonné** | WhatsApp après révélation du contact |
| §4 — Propriétaire crée ses annonces | Phase 2 | Saisie par l'équipe à l'amorçage |
| §5.2 — Notification du propriétaire | MVP, mais par email | WhatsApp automatique en Phase 2 |
| §6 — Next.js + NestJS séparés | **Écarté** | [ADR-003](../memory/decisions/ADR-003-monorepo-expo-nextjs.md) |
| §6 — Cloudinary | **Remplacé** | Supabase Storage, ADR-004 |
| §7 — Noms de champs en français | **Écarté** | Schéma en anglais, `docs/tech/stack.md` §4 |
| §8.1 — OTP SMS | Phase 2 | Aucun fournisseur identifié |
| §10 — Avis, vocal, application native, géolocalisation, multi-agences | Phase 2-3 | Conformes au CDC |
| §11.2 — Rapport de tests de charge | Phase 2 | Sans trafic, un test de charge mesure une hypothèse |

**Couverture** : 12 des 19 exigences fonctionnelles du CDC sont dans le MVP.
Deux sont supprimées comme erronées ou inutiles, cinq sont reportées.

---

## 8. Phases

| Phase | Objectif | Critère de sortie |
|---|---|---|
| **0 — Amorçage** *(en parallèle du développement)* | Recruter 30 à 50 propriétaires, photographier, saisir les annonces. Conduire 10 entretiens utilisateurs pour confronter §2.2 au réel | 30 annonces prêtes à publier |
| **1 — Prototype de l'agent** | Un agent branché sur des données réelles, sans interface finie | 20 requêtes réelles passées ; ≥ 80 % de résultats pertinents. **Si ce seuil n'est pas atteint, on ne construit pas la suite** |
| **2 — MVP** | Le parcours critique de §4.1, de bout en bout | Les 5 critères de §3.2 |
| **3 — Automatisation** | Agrégateur de paiement, notifications WhatsApp, création d'annonce par le propriétaire, avis | Déclenchée à 5 réservations/jour |

**La Phase 1 est un point de non-retour délibéré.** Elle place le risque le plus
élevé en premier. Un agent qui ne comprend pas les demandes réelles en français
camerounais rend inutile tout ce qui serait construit autour.

---

## 9. Ce que ce document ne tranche pas

| Sujet | Bloque | Qui décide |
|---|---|---|
| Nom commercial | Identifiants iOS/Android | Fondateur |
| Montant de l'avance et taux de commission | Ouverture publique | Fondateur, après relevé des prix réels |
| Cadre juridique de l'encaissement | Ouverture publique | Fondateur, avec un conseil |
| Agrégateur de paiement | Phase 3 | Après vérification externe |
| Région d'hébergement | Mise en production | Après mesure de latence depuis Douala |

---

## 10. Changelog

| Version | Date | Changement |
|---|---|---|
| 1.0 | 2026-08-07 | Création. Agrège le CDC v2.0, `plan.md`, l'observation de PUOL et les ADR 001 à 007. Tranche D-04 : encaissement manuel au MVP, pas de messagerie interne, création d'annonce par l'équipe. |
