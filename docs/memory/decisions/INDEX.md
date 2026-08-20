# Index des décisions (ADR)

Registre unique des décisions structurantes. Format imposé par le skill
`memory/store_decisions`. Consulté par `memory/recall_context` avant toute
décision structurante ou tâche complexe.

**Règle** : toute décision qui impacte le périmètre, l'architecture ou le budget
passe par une ADR. Une décision remplacée n'est jamais supprimée — elle est
marquée `remplacée par ADR-XXX`.

| ADR | Titre | Domaine | Date | Statut |
|---|---|---|---|---|
| [001](ADR-001-prd-source-de-verite-unique.md) | Le PRD devient la source de vérité produit unique | Produit | 2026-08-07 | Acceptée |
| [002](ADR-002-arborescence-documentaire-unique.md) | Les artefacts des skills vivent sous `docs/` | Processus | 2026-08-07 | Acceptée |
| [003](ADR-003-monorepo-expo-nextjs.md) | Monorepo pnpm : Expo (iOS/Android) + Next.js (web) | Tech | 2026-08-07 | Acceptée |
| [004](ADR-004-supabase-et-docker.md) | Supabase pour les services, Docker en local | Tech | 2026-08-07 | Acceptée |
| [005](ADR-005-agent-ia-canal-principal.md) | L'agent IA est le canal de réservation principal | Produit | 2026-08-07 | Acceptée |
| [006](ADR-006-identite-visuelle.md) | Identité visuelle : violet, noir, blanc, gris | Design | 2026-08-07 | Acceptée |
| [007](ADR-007-modele-economique-avance-en-ligne.md) | Modèle économique : avance en ligne + solde à l'arrivée | Business | 2026-08-07 | Acceptée |
| [008](ADR-008-perimetre-mvp.md) | Périmètre MVP : encaissement manuel, pas de messagerie, annonces saisies par l'équipe | Produit | 2026-08-07 | Acceptée |

## Alertes à opposer avant d'agir

À vérifier par `memory/recall_context` avant toute tâche technique.

| Si un agent s'apprête à… | Alerte |
|---|---|
| Intégrer NotchPay, CinetPay, Flutterwave, Stripe ou tout prestataire de paiement | **Contredit ADR-008.** L'encaissement est manuel au MVP. Suspendre et escalader |
| Construire une messagerie interne | **Contredit ADR-008.** WhatsApp après révélation du contact |
| Écrire une couleur en dur hors de `packages/ui-tokens` | **Contredit ADR-006.** La palette est provisoire ; toute couleur en dur rend le futur changement de marque coûteux |
| Ajouter `VISITEUR` à l'énumération des rôles | **Contredit le PRD §6.** Un visiteur non connecté n'a pas de ligne en base |
| Écrire un montant en flottant | **Contredit `docs/tech/stack.md` §4.** Le FCFA n'a pas de décimales |
| Créer une politique RLS sans test de refus | **Contredit ADR-004.** Une politique qui n'a jamais bloqué personne n'a jamais été testée |
| Nommer un champ de base en français | **Contredit `docs/tech/stack.md` §4.** Schéma en anglais, écart au CDC assumé |

## Décisions en attente d'arbitrage

| Sujet | Bloque | Ce qui manque |
|---|---|---|
| Nom commercial du produit | Identifiants d'application iOS/Android, noms de paquets | Décision du fondateur — voir ADR-003, section « Ce qui reste ouvert » |
| Montant de l'avance, taux de commission | Ouverture publique | Relevé des prix réels à Douala — voir ADR-007 |
| Cadre juridique de l'encaissement | Ouverture publique | Conseil externe. **Rien n'existe nulle part** — voir ADR-008 |
| Agrégateur de paiement Mobile Money | Phase 3 | Vérification externe de NotchPay / CinetPay (existence, tarifs, KYC, délais) |
| Région d'hébergement Supabase | Mise en production | Mesure de latence réelle depuis Douala — voir ADR-004 |

## Correspondance avec l'ancien registre

`docs/decisions.md` était le registre provisoire créé pendant l'audit du
7 août, avant la lecture des skills. Il est conservé pour son historique, mais
**il n'a plus autorité** : ses arbitrages ouverts D-01, D-03 et D-06 sont
tranchés ici.

| Ancien | Devient |
|---|---|
| D-01 — positionnement face à PUOL | ADR-005 + ADR-007 |
| D-02 — direction visuelle | ADR-006 |
| D-03 — architecture | ADR-003 + ADR-004 |
| D-04 — périmètre v1.0 | Traité par le PRD (ADR-001), pas encore rédigé |
| D-05 — coûts et juridique | Partiellement ADR-007 ; le reste reste ouvert |
| D-06 — qui fait autorité | ADR-001 |
| DA-01 à DA-05 | Toujours valides, décisions de versionnement, non reprises en ADR |
