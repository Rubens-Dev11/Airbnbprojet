# ADR-001 — Le PRD devient la source de vérité produit unique

- **Statut** : Acceptée
- **Date** : 2026-08-07
- **Domaine** : Produit
- **Décidée par** : arbitrage délégué explicitement par le fondateur
- **Remplace** : l'arbitrage ouvert D-06 de `docs/decisions.md`

## Contexte

Trois documents décrivaient le produit, sans qu'aucun n'ait autorité :

1. **`CDC_Plateforme_Douala_v2.pdf`** (12 mai 2026) — 17 pages, fonctionnel
   solide, mais : affirme à tort qu'aucun concurrent local n'existe, ne modélise
   pas la disponibilité par dates, ne contient aucun montant, aucun volet
   juridique.
2. **`plan.md`** (9 juillet 2026) — 242 lignes, apporte le modèle économique, le
   paiement, l'anti-désintermédiation et l'amorçage de l'offre, mais contredit
   le CDC sur sept points structurants et reprend sa prémisse marché fausse.
3. **`docs/roadmap.md`** (7 août 2026) — un troisième planning.

Deux documents qui se contredisent, ce n'est pas une richesse : c'est
l'assurance que le code suivra l'un des deux au hasard, et qu'on découvrira
lequel six mois plus tard.

Le skill `documentation/generate_prd` tranche déjà la question :
*« le PRD prime sur tout artefact antérieur en cas de conflit »*. Il prescrit
aussi de détecter les contradictions entre artefacts, de les faire arbitrer,
**puis** de rédiger.

## Décision

`docs/documentation/PRD.md` devient la **source de vérité produit unique**.

Conséquences immédiates :

- Le **CDC v2.0** devient un document d'origine : il garde sa valeur de
  contexte et de justification, il ne pilote plus le développement.
- **`plan.md`** devient un document d'entrée au même titre.
- **`docs/roadmap.md`** cesse d'être un planning concurrent : il redevient un
  document de suivi, alimenté par le PRD.
- Tant que le PRD n'existe pas, **aucun code applicatif métier n'est écrit**.
  La structure du projet (ADR-003, ADR-004) peut être posée en parallèle : elle
  ne dépend d'aucun arbitrage fonctionnel.

Le PRD devra explicitement lister, comme le prescrit `generate_prd`, les
exigences du CDC reportées hors MVP — pas les faire disparaître en silence.

## Alternatives rejetées

**Publier un CDC v2.1 qui absorbe `plan.md`.** Rejetée : conserve un PDF comme
source de vérité. Un PDF ne se diffe pas, ne se relit pas en revue, et se met à
jour par une personne à la fois. Le dépôt a déjà payé le prix d'un document
non diffable — le `README.md` en UTF-16 traité comme un binaire.

**Faire de `plan.md` la référence.** Rejetée : il est plus récent et plus
complet côté business, mais son analyse de marché est fausse et son audit du
dépôt est resté en surface. Le promouvoir tel quel reviendrait à graver son
erreur.

**Ne rien trancher et avancer.** Rejetée : c'est le statu quo qui a produit la
situation.

## Conséquences

**Positives.** Une seule référence. Toute contradiction future devient une
modification du PRD avec entrée au changelog, donc traçable. La règle est
applicable par un agent comme par un humain.

**Négatives, assumées.** La rédaction du PRD est un travail réel qui retarde le
premier écran. Et le CDC, s'il a une valeur contractuelle ou académique auprès
d'un tiers, devra être maintenu en parallèle — coût de double écriture à
signaler dès qu'il se présente.

## Artefacts liés

- `CDC_Plateforme_Douala_v2.pdf`, `plan.md`
- `docs/etat-des-lieux.md` §5.3 — table des sept contradictions
- Skills : `documentation/generate_prd`, `memory/recall_context`
