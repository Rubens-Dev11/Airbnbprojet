# Skill Name

propose_architecture

# Description

Conçoit l'architecture technique du produit : structure applicative, modèle de données, flux critiques et points d'intégration. Sert de plan directeur aux Dev Agents.

# Capabilities

- Définir l'architecture applicative (frontend, backend, DB, services externes)
- Concevoir le schéma de données complet avec relations
- Décrire les flux critiques (auth, recherche, réservation, paiement)
- Spécifier les contrats d'API principaux
- Anticiper les points d'échelle sans sur-ingénierie

# Inputs

- `product/mvp_scope.md`
- `tech/choose_tech_stack.md` (stack validé)
- `tech/repo_analysis.md`

# Outputs

- `tech/architecture.md` contenant :
  - Diagramme d'architecture (texte/ASCII)
  - Schéma de données (tables, colonnes, relations, index)
  - Flux séquentiels des parcours critiques
  - Contrats d'API (routes, méthodes, payloads)
  - Décisions d'architecture (ADR courts) avec alternatives rejetées

# Instructions

1. Partir du parcours critique MVP et lister chaque interaction système.
2. Concevoir le schéma DB : entités du MVP uniquement (User, Listing, Booking), avec contraintes et index sur les colonnes de recherche.
3. Décrire le flux de réservation étape par étape : vérification de disponibilité, création, statuts (pending → confirmed → completed / cancelled).
4. Définir les routes API : méthode, chemin, entrée, sortie, règle d'autorisation par route.
5. Documenter chaque décision structurante en mini-ADR : contexte, décision, alternatives rejetées.
6. Garder l'architecture au plus simple : monolithe Next.js tant que rien ne justifie plus.
7. Transmettre à `documentation/generate_technical_specs`.

# Example Usage

> Input : MVP Douala, stack Next.js + Neon.
>
> Output : Monolithe Next.js App Router. Tables : users, listings (index sur quartier), bookings (contrainte anti-chevauchement de dates). Flux réservation : check disponibilité → création pending → confirmation hôte → confirmed. ADR-003 : pas de microservices — rejeté car équipe de 1-3 agents et charge faible.
