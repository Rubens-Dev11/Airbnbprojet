# Skill Name

choose_tech_stack

# Description

Sélectionne le stack technique optimal en fonction du produit, des contraintes (équipe, budget, marché local) et de l'écosystème existant. Justifie chaque choix face à ses alternatives.

# Capabilities

- Comparer les options par couche (frontend, backend, DB, auth, paiement, hébergement)
- Pondérer selon les contraintes réelles : vitesse de dev, coût, compétences, marché local
- Choisir les intégrations tierces (paiement Mobile Money, images, cartes, emails)
- Verrouiller les versions et conventions

# Inputs

- `product/mvp_scope.md`
- `tech/repo_analysis.md`
- Contraintes : budget, délais, connexions internet cibles (marché camerounais = mobile-first, débit variable)

# Outputs

- `tech/stack.md` contenant :
  - Tableau par couche : choix retenu, alternatives, justification
  - Intégrations tierces avec coûts
  - Conventions : TypeScript strict, structure de dossiers, nommage
  - Versions verrouillées

# Instructions

1. Lister les besoins par couche à partir du scope MVP.
2. Pour chaque couche, comparer 2-3 options maximum avec un critère dominant (vitesse de livraison pour un MVP).
3. Prendre en compte le contexte local : performances sur mobile 3G, paiement Mobile Money (CinetPay, Notch Pay, Flutterwave), SMS.
4. Privilégier un stack cohérent et intégré plutôt que le "meilleur" outil par couche.
5. Documenter les conventions de code que tous les Dev Agents devront suivre.
6. Transmettre à `propose_architecture`.

# Example Usage

> Input : MVP Douala, budget minimal, équipe = agents IA.
>
> Output : Next.js 16 (App Router) + TypeScript, Neon Postgres + Drizzle, Better Auth, Tailwind + shadcn/ui, Vercel Blob (photos logements), déploiement Vercel. Paiement Phase 2 : Notch Pay (MTN MoMo + Orange Money). Alternative rejetée : app mobile native — rejetée au MVP, PWA suffit.
