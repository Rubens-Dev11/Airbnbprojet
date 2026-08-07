# Skill Name

assign_tasks_to_agents

# Description

Assigne les tâches techniques aux Dev Agents selon leur spécialité et leur charge, avec un brief d'exécution complet. Gère le routage et l'équilibrage du travail.

# Capabilities

- Router chaque tâche vers l'agent compétent (Frontend, Backend, DB, QA)
- Équilibrer la charge entre agents
- Générer un brief d'exécution autoportant par assignation
- Définir le protocole de rendu (branche, PR, format de compte-rendu)

# Inputs

- `execution/tasks.md`
- Registre des agents disponibles et leurs spécialités
- État de charge courant (depuis `track_progress`)

# Outputs

- `execution/assignments.md` contenant :
  - Tableau tâche → agent → statut → branche
  - Brief par assignation : contexte, tâche, DoD, contraintes, fichiers de référence
  - Protocole de rendu attendu

# Instructions

1. Trier les tâches prêtes (dépendances résolues) par priorité.
2. Router selon la nature : UI → Frontend Agent, API/logique → Backend Agent, schéma → DB Agent, vérification → QA Agent.
3. Rédiger le brief : objectif, fichiers concernés, contrat d'API, maquette de référence, DoD, conventions à respecter (issues de `tech/stack.md`).
4. Imposer le protocole : une branche par tâche (`feat/T-XXX-description`), PR vers la branche de lot, compte-rendu au format standard.
5. Ne jamais assigner une tâche bloquée ; la garder en file d'attente.
6. Notifier `track_progress` de chaque assignation.

# Example Usage

> Input : T-022 (route POST /api/bookings) prête, Backend Agent libre.
>
> Output : T-022 → Backend Agent. Brief : "Créer `app/api/bookings/route.ts`. Contrat : POST {listingId, checkIn, checkOut} → 201 {bookingId} | 409 si indisponible | 401 sans session. Vérifier le chevauchement via la contrainte de T-021. DoD : les 3 codes de retour testés. Branche : feat/T-022-booking-api."
