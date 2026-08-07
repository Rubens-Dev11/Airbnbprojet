# Fonctionnalités critiques — liste de non-régression

Ce document liste les parcours qui ne doivent **jamais** régresser. Il se
vérifie **avant et après** chaque modification. Toute régression détectée est
signalée explicitement, jamais corrigée en silence.

## État au 7 août 2026

**La liste est vide.** Ce n'est pas un oubli : le dépôt ne contient aucun code
applicatif, donc aucune fonctionnalité en production ne peut régresser. Écrire
ici des lignes « à venir » reviendrait à faire passer une intention pour un
état — précisément ce que les règles de travail interdisent.

## Règle d'alimentation

Une fonctionnalité entre dans cette liste **le jour où elle est livrée et
vérifiée**, jamais quand elle est planifiée. Chaque entrée doit comporter :

| Colonne | Contenu attendu |
|---|---|
| Parcours | Le chemin utilisateur, du point d'entrée au résultat observable |
| Rôle | VISITEUR / LOCATAIRE / PROPRIETAIRE / ADMIN |
| Comment le vérifier | Commande de test automatisé, **ou** scénario manuel reproductible pas à pas |
| Preuve de la dernière vérification | Date + sortie réelle observée (pas « OK ») |
| Livré le | Date + commit |

## Modèle d'entrée (à recopier)

```
### CF-01 — <nom du parcours>

- **Rôle** : LOCATAIRE
- **Parcours** : ...
- **Vérification** : `pnpm test:e2e -- booking.spec.ts` — ou scénario manuel :
  1. ... 2. ... 3. Résultat attendu : ...
- **Dernière vérification** : 2026-XX-XX — sortie observée : « ... »
- **Livré le** : 2026-XX-XX (commit `abcdef1`)
```

## Candidats identifiés dans le cahier des charges

Ces parcours **deviendront** critiques une fois livrés. Ils sont listés ici à
titre d'anticipation, et sont **explicitement hors de la liste de
non-régression** tant qu'ils n'existent pas.

- Authentification multi-rôles et cloisonnement des droits (CDC §4, §8.1)
- Un propriétaire ne voit et ne modifie que **ses** logements (CDC §9)
- Une réservation n'est acceptable que par le propriétaire du logement (CDC §9)
- Un logement accepté bloque automatiquement les dates (CDC §9)
- Recherche et filtres publics (CDC §5.1)
- Chatbot IA : session indépendante par utilisateur (CDC §5.3)
- Clé API OpenAI jamais exposée au frontend (CDC §8.2)
