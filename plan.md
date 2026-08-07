# PLAN STRATÉGIQUE — Plateforme de Réservation de Chambres Meublées à Douala

> **Document d'exécution** | Version 1.0 | Produit par l'orchestration des agents Strategy, Product, Tech, Execution et Memory
> Basé sur : audit du repo `Rubens-Dev11/Airbnbprojet`, CDC v2.0 (17 pages), 33 maquettes/captures de référence

---

## 1. AUDIT DE L'EXISTANT

### 1.1 État du repository

| Élément | État | Verdict |
|---|---|---|
| Code applicatif | **Aucun** (0 ligne de code produit) | Projet en phase pré-développement |
| `CDC_Plateforme_Douala_v2.pdf` | CDC v2.0 complet, 17 pages, 11 sections | Bonne qualité, quelques ambiguïtés (voir §2) |
| `InspirationsMaquettes/` | 10 images (maquettes mobile orange, desktop dark, captures Airbnb) | Direction visuelle claire mais **incohérente entre elles** |
| `fluxdereservation/` | 23 captures du parcours Airbnb complet (accueil → recherche → filtres → détail → login → paiement) | Excellent référentiel UX, exploitable tel quel |
| `infoAirbnbPlaystore/` | Descriptif Airbnb + captures Play Store | Référence de positionnement |
| `agent-skills/` | 20 skills IA en 6 modules + architecture multi-agents | Système d'agents opérationnel |
| README.md | Vide (titre seul) | À rédiger au premier commit de code |

### 1.2 Forces

- **CDC solide** : modèle de données défini (5 entités), rôles clairs (4), architecture argumentée, plan de sprints réaliste.
- **Référentiel UX exhaustif** : les 23 captures du flux de réservation Airbnb couvrent 100 % du parcours cible — pas besoin de re-concevoir l'UX de zéro.
- **Lucidité technique** : le CDC rejette explicitement n8n/Make/Vapi comme cerveau IA — décision correcte et rare.
- **Opportunité marché validée** : aucun concurrent local avec Mobile Money + français + IA.

### 1.3 Faiblesses, incohérences et risques

| # | Problème | Gravité | Correction |
|---|---|---|---|
| F1 | **Paiement absent du MVP** : le CDC repousse Mobile Money en v2 (6 mois). Or sans paiement, pas de revenus, pas de validation du business model. | 🔴 Critique | Intégrer le paiement Mobile Money dès le MVP via agrégateur (voir §6) |
| F2 | **Deux directions visuelles contradictoires** dans les maquettes (mobile orange vif vs desktop sombre/rouge Airbnb) | 🟠 Moyen | Trancher : identité propre orange/terracotta, mobile-first (cohérente avec les 80 % d'usage mobile du CDC) |
| F3 | **Stack sur-dimensionnée** : Next.js + NestJS séparés = 2 déploiements, 2 codebases, CORS, double auth. Excessif pour un MVP à 50-100 utilisateurs simultanés. | 🟠 Moyen | Fusionner : Next.js full-stack (Route Handlers + Server Actions) — voir §4.4 |
| F4 | **OTP SMS au MVP** : coût par SMS, intégration opérateur complexe au Cameroun, friction d'inscription | 🟡 Faible | MVP : vérification email + téléphone déclaratif. OTP SMS en v1.1 quand le volume le justifie |
| F5 | Le CDC ne définit **aucun mécanisme anti-désintermédiation** (locataire et propriétaire se contactent et paient hors plateforme) | 🔴 Critique | Masquer le téléphone du propriétaire jusqu'au paiement de l'acompte (voir §5) |
| F6 | Pas de stratégie d'**amorçage de l'offre** (marketplace vide au lancement) | 🔴 Critique | Phase 0 : onboarding manuel de 30-50 logements avant ouverture publique (voir §4.3) |
| F7 | `ChatSession.historique` en JSONB unique : croissance illimitée, pas d'indexation par message | 🟡 Faible | Table `ChatMessage` séparée (1 ligne = 1 message) |

---

## 2. OPTIMISATION DU CAHIER DES CHARGES

Reformulations des zones ambiguës — chaque point remplace la version floue du CDC :

1. **« Chatbot IA textuel (recherche + recommandation) »** → *L'assistant IA est le canal de réservation principal, pas un widget d'appoint.* Il doit pouvoir : rechercher, comparer, répondre aux questions, **et initier une réservation de bout en bout** (function calling : `search_rooms`, `get_room_details`, `check_availability`, `create_booking_draft`). C'est la proposition de valeur différenciante (voir §4.1).
2. **« Système de réservation avec confirmation »** → préciser la machine à états : `EN_ATTENTE → (ACCEPTEE | REFUSEE)` sous **24 h maximum**, sinon expiration automatique et notification au locataire. Une réservation `ACCEPTEE` bloque les dates via une contrainte d'exclusion PostgreSQL (pas seulement applicative).
3. **« Interface administrateur complète »** → réduire au MVP : validation des propriétaires, modération des annonces, liste des réservations, stats basiques (4 écrans). « Complète » est indéfini et inflatoire.
4. **« Responsive mobile-first »** → objectif mesurable : LCP < 2,5 s sur connexion 3G simulée, images WebP ≤ 100 Ko, bundle initial < 200 Ko.
5. **« Authentification sécurisée multi-rôles »** → un utilisateur a un rôle unique (`LOCATAIRE` par défaut, upgrade `PROPRIETAIRE` après validation admin). Pas de multi-rôles simultanés au MVP.
6. **Disponibilités** → le CDC ne définit pas comment un propriétaire « gère les disponibilités ». MVP : calendrier de blocage manuel (dates indisponibles) + blocage automatique par réservation acceptée.
7. **Prix** → tout montant est un `INTEGER` en FCFA (pas de décimales, le FCFA n'en a pas). Affichage : `25 000 FCFA / nuit`.

---

## 3. ANALYSE DES DOSSIERS DE RÉFÉRENCE

### 3.1 Vision produit déduite des 33 captures

Le parcours documenté dans `fluxdereservation/` définit le standard UX attendu :

- **Accueil** : grille de cartes logement (photo, quartier, prix/nuit, note) + barre de recherche proéminente
- **Recherche** : destination + dates + voyageurs ; résultats en liste **et** carte interactive avec position
- **Filtres** : prix (fourchette), type de logement, équipements — en panneau latéral/modal
- **Détail logement** : galerie photos plein écran, description, équipements, carte, encart de réservation collant (dates → prix total → CTA)
- **Réservation** : sélection dates → récapitulatif prix → login/inscription si nécessaire (le flux ne casse pas : retour au point de réservation après auth) → paiement
- **Paiement** : page « Confirmer et payer » en 2 colonnes : moyens de paiement à gauche, récapitulatif (photo, dates, détail du prix, conditions d'annulation) à droite

### 3.2 Adaptations locales obligatoires (vs Airbnb)

| Airbnb | Notre plateforme |
|---|---|
| Carte bancaire, PayPal, Google Pay | **MTN MoMo + Orange Money d'abord**, carte en option |
| Anglais dominant | **Français par défaut** |
| Paiement 100 % en ligne à la réservation | **Acompte en ligne + solde à l'arrivée** (adapté à la confiance locale) |
| Recherche par formulaire | **Recherche conversationnelle IA en langage naturel** (différenciateur) |
| Quartiers génériques | Référentiel des quartiers de Douala : Akwa, Bonanjo, Bonapriso, Deido, Makepe, Bali, Logbessou... |

---

## 4. PLAN STRATÉGIQUE

### 4.1 Vision produit

> **« Trouver et réserver une chambre meublée à Douala aussi simplement qu'envoyer un message WhatsApp. »**

- **Problème résolu** : le marché des meublés de Douala est informel, éclaté (WhatsApp, Facebook, bouche-à-oreille), sans réservation en ligne, sans garantie contre les arnaques.
- **Proposition de valeur (différenciateur central)** : là où Airbnb impose formulaires et filtres, l'utilisateur **dialogue avec un agent IA** : *« Je cherche un studio climatisé à Akwa pour ce week-end, budget 20 000 FCFA/nuit »* → l'agent comprend, cherche, compare, recommande et **réserve**. L'expérience conversationnelle EST le produit ; la navigation classique (grille + filtres) reste disponible en second canal.
- **Pour qui** : (a) locataires urbains et diaspora en visite, mobiles-first, habitués à WhatsApp ; (b) propriétaires de meublés cherchant visibilité et réservations garanties.

### 4.2 Définition du MVP (strict)

**Dedans (v1.0) :**

| Fonctionnalité | Détail |
|---|---|
| Catalogue public | Grille de logements, page détail avec galerie, référentiel quartiers Douala |
| Recherche + filtres | Quartier, prix, dates, type, équipements |
| **Assistant IA conversationnel** | GPT-4o + function calling, streaming, recherche + recommandation + pré-réservation, mémoire de session, français |
| Réservation | Demande → acceptation propriétaire sous 24 h → blocage dates |
| **Paiement acompte Mobile Money** | 30 % d'acompte via agrégateur (MTN MoMo + Orange Money), solde à l'arrivée |
| Espace propriétaire | CRUD logements, upload photos, calendrier de disponibilités, gestion des demandes |
| Admin | Validation propriétaires, modération annonces, vue réservations, stats basiques |
| Auth | Email + mot de passe, JWT, rôles LOCATAIRE / PROPRIETAIRE / ADMIN |

**Hors MVP (refusé jusqu'à v1.1+)** : avis/notation, OTP SMS, notifications WhatsApp, assistant vocal, app mobile native, messagerie interne temps réel, multi-langue, géolocalisation avancée, multi-agences.

### 4.3 Roadmap

**Phase 0 — Amorçage de l'offre (en parallèle du développement)**
- Recruter manuellement 30-50 propriétaires (démarchage WhatsApp/terrain), photographier les logements, saisir les annonces à leur place. **Une marketplace vide tue le lancement.**

**Phase 1 — MVP (Sprints de 2 semaines)**

| Sprint | Livrable | Critère de sortie |
|---|---|---|
| 1 | Setup Next.js full-stack, PostgreSQL, schéma complet, auth multi-rôles, design system (tokens orange/terracotta) | Login/register fonctionnels, seed de données |
| 2 | Catalogue public : accueil, recherche, filtres, page détail | Parcours visiteur complet sur mobile 3G |
| 3 | Espace propriétaire (CRUD + photos + calendrier) + admin (validation, modération) | Un propriétaire réel publie une annonce seul |
| 4 | Système de réservation complet (machine à états, expiration 24 h, blocage dates) | Réservation de bout en bout testée |
| 5 | **Agent IA** : chat streaming, function calling (search/details/availability/booking draft), mémoire de session | L'agent réserve un logement en dialogue naturel |
| 6 | **Paiement Mobile Money** (agrégateur, webhooks, réconciliation) + tests de charge + déploiement production | Premier paiement réel encaissé en sandbox puis production |

**Phase 2 — Traction (mois 4-6)** : avis et notation, notifications WhatsApp (n8n périphérique), OTP SMS, tableau de bord propriétaire enrichi, SEO local.

**Phase 3 — Expansion (mois 7-12)** : assistant vocal (Whisper + GPT-4o Audio), app mobile React Native, Yaoundé puis autres villes, programme de fidélité.

### 4.4 Décision d'architecture (écart assumé vs CDC)

Le CDC propose Next.js + NestJS séparés. **Recommandation : monolithe Next.js full-stack** pour le MVP :

| Couche | Choix | Justification |
|---|---|---|
| Frontend + API | **Next.js (App Router)** — Server Components, Route Handlers, Server Actions | 1 seule codebase, 1 déploiement, pas de CORS, time-to-market divisé par ~2 |
| Agent IA | **Vercel AI SDK** (`streamText` + tools) dans une Route Handler | Function calling + streaming natifs, sessions indépendantes par utilisateur, exactement le comportement décrit au CDC §5.3 |
| Base de données | **PostgreSQL (Neon)** + Drizzle ORM | Serverless, pooling intégré (répond à l'exigence PgBouncer du CDC), migrations versionnées |
| Auth | **Better Auth** (email/password, sessions, rôles) | Hash + sessions sécurisées sans réinventer JWT à la main |
| Médias | Cloudinary (conforme CDC) ou Vercel Blob | Compression auto, WebP, CDN |
| Automations périphériques | n8n auto-hébergé (conforme CDC) | Notifications uniquement, jamais le cerveau IA |
| Hébergement | Vercel | Scaling automatique, edge CDN (important pour la 3G) |

> La migration vers un backend NestJS séparé reste possible en Phase 3 si le trafic l'exige. À 50-100 sessions simultanées, ce découplage est prématuré.

---

## 5. BUSINESS MODEL

### 5.1 Sources de revenus

| # | Source | Mécanisme | Taux |
|---|---|---|---|
| 1 | **Commission sur réservation** (principal) | Prélevée sur l'acompte encaissé en ligne | **10 % du montant total du séjour** (Airbnb ~14-16 %, agences locales 20-30 % → positionnement agressif) |
| 2 | Frais de service locataire | Ajoutés au prix affiché au checkout | 3 % plafonnés à 5 000 FCFA |
| 3 | **Annonces premium** (dès mois 3) | Mise en avant en tête de liste + badge | 5 000-15 000 FCFA / mois / annonce |
| 4 | Abonnement propriétaire Pro (Phase 2) | Multi-logements, stats avancées, réponses IA automatiques | 10 000-25 000 FCFA / mois |

### 5.2 Mécanique anti-désintermédiation (condition de survie du modèle)

1. Le téléphone et l'adresse exacte du propriétaire sont **masqués jusqu'au paiement de l'acompte**.
2. L'acompte en ligne (30 %) **contient la commission** : la plateforme se paie à la source, le solde (70 %) se règle à l'arrivée — aligné avec les pratiques locales de confiance.
3. Valeur rendue au propriétaire pour qu'il reste : calendrier, visibilité, locataires vérifiés, historique, statistiques.

### 5.3 Hypothèses de revenus (scénario prudent, 12 mois)

| Hypothèse | Valeur |
|---|---|
| Prix moyen/nuit à Douala | 22 000 FCFA |
| Durée moyenne de séjour | 4 nuits → panier ≈ 88 000 FCFA |
| Revenu par réservation (10 % + frais service) | ≈ 11 400 FCFA |
| Mois 6 : 60 réservations/mois | ≈ 685 000 FCFA/mois |
| Mois 12 : 250 réservations/mois + 30 annonces premium | ≈ 3,1 M FCFA/mois (~4 700 €) |

**Coûts mensuels MVP** : hébergement + BDD ≈ 25-45 k FCFA ; OpenAI API ≈ 30-100 k FCFA (GPT-4o, ~1 500 conversations) ; Cloudinary gratuit puis ~50 k ; frais agrégateur ~2-3,5 % des flux. **Point mort estimé : mois 7-9.**

### 5.4 KPIs de pilotage

- Taux de conversion visite → réservation demandée (cible ≥ 3 %)
- Part des réservations initiées via l'agent IA (cible ≥ 40 % — valide le différenciateur)
- Taux d'acceptation propriétaire sous 24 h (cible ≥ 80 %)
- Taux de désintermédiation estimé (réservations annulées puis contact direct)

---

## 6. INTÉGRATION DES PAIEMENTS (CRITIQUE)

### 6.1 Contexte : Douala, Cameroun

- Le Mobile Money domine : **MTN MoMo + Orange Money couvrent ~90 % des paiements numériques** ; la carte bancaire est marginale.
- Devise : XAF (FCFA), sans décimales. Zone BEAC.
- Intégrer les API officielles MTN/Orange en direct = 2 contrats commerciaux, 2 intégrations, KYC lourd, délais de plusieurs mois. **Un agrégateur est la seule option compatible avec un lancement rapide.**

### 6.2 Choix recommandé

| Rang | Agrégateur | Pourquoi |
|---|---|---|
| **1. NotchPay** (recommandé) | Camerounais, MTN MoMo + Orange Money via une seule API REST (`channel: 'cm.mtn'` / `'cm.orange'`), sandbox complète, webhooks signés, documentation claire, support local, onboarding rapide | Intégration estimée : 3-5 jours |
| **2. CinetPay** (backup) | Couverture Afrique de l'Ouest + Centrale (utile pour l'expansion régionale), API mature, très utilisé | Frais légèrement supérieurs, support moins local |
| 3. Flutterwave | Ajout des cartes internationales (diaspora) | En complément Phase 2, pas en principal (couverture XAF/Cameroun moins profonde) |

### 6.3 Architecture d'intégration

```
Locataire (checkout)                    Plateforme (Next.js)                   NotchPay
       │  1. Confirme la réservation          │                                    │
       │────────────────────────────────────▶ │  2. POST /payments                 │
       │                                      │    {amount: acompte, currency:     │
       │                                      │     'XAF', channel: 'cm.mtn',      │
       │                                      │     phone, reference: bookingId}   │
       │                                      │──────────────────────────────────▶ │
       │  3. Push USSD/app sur son téléphone  │                                    │
       │ ◀────────────────────────────────────┼────────────────────────────────────│
       │  4. Valide avec son code PIN MoMo    │                                    │
       │                                      │  5. Webhook signé `payment.success`│
       │                                      │ ◀──────────────────────────────────│
       │                                      │  6. Vérifie signature + montant,   │
       │                                      │     passe Payment → PAYE,          │
       │                                      │     débloque les coordonnées,      │
       │                                      │     notifie les deux parties       │
       │  7. Confirmation + contact proprio   │                                    │
       │ ◀────────────────────────────────────│                                    │
```

**Règles d'implémentation :**
- Table `Payment` dédiée : `id, booking_id, provider, provider_ref, montant, statut (INITIE|EN_ATTENTE|PAYE|ECHOUE|REMBOURSE), webhook_payload, cree_le` — jamais de mise à jour de statut sans webhook vérifié (signature + montant + idempotence sur `provider_ref`).
- Réconciliation quotidienne (cron) entre l'API agrégateur et la table `Payment`.
- Reversement propriétaires : **manuel par lot les 5 premiers mois** (virement MoMo hebdomadaire), automatisé ensuite via l'API de payout de l'agrégateur.
- Clés API en variables d'environnement serveur uniquement ; sandbox obligatoire jusqu'au sprint 6.

---

## 7. PROCHAINES ACTIONS IMMÉDIATES

1. **Valider ce plan** (décisions à trancher : monolithe Next.js ✓/✗, acompte 30 % ✓/✗, NotchPay ✓/✗).
2. Créer un compte NotchPay et obtenir les clés sandbox (parallélisable dès aujourd'hui).
3. Lancer la Phase 0 : liste de 50 propriétaires cibles à Douala, script de démarchage WhatsApp.
4. Démarrer le Sprint 1 : initialisation du projet Next.js + PostgreSQL + auth + design system.
5. Rédiger les 10 user stories prioritaires du Sprint 2 (skill `create_user_stories`).

---

*Document généré via les skills : `analyze_github_repo`, `audit_codebase`, `analyze_idea`, `define_vision`, `define_mvp`, `prioritize_features`, `generate_business_model`, `generate_product_roadmap`, `propose_architecture`, `choose_tech_stack`, `generate_prd`. Décisions consignées pour la mémoire du projet (`store_decisions`).*
