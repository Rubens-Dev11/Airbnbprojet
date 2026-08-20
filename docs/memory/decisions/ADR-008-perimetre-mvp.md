# ADR-008 — Périmètre du MVP : encaissement manuel, pas de messagerie, annonces saisies par l'équipe

- **Statut** : Acceptée
- **Date** : 2026-08-07
- **Domaine** : Produit
- **Remplace** : l'arbitrage ouvert D-04 de `docs/decisions.md`
- **Détail complet** : [PRD v1.0](../../documentation/PRD.md) §4

## Contexte

Le MVP a un seul travail : établir si la réservation par conversation
([ADR-005](ADR-005-agent-ia-canal-principal.md)) tient face à un concurrent
déjà en production. Trois fonctionnalités coûteuses menaçaient d'absorber le
temps sans rien apporter à cette validation.

## Décisions

### 1. L'avance est encaissée à la main au MVP

Le locataire paie par Mobile Money sur un numéro affiché, saisit la référence de
sa transaction, l'équipe confirme dans un écran d'administration. Le blocage des
dates et la révélation du contact découlent de cette confirmation.

**Le MVP encaisse donc réellement — seule l'automatisation est reportée.**
`plan.md` §4.2 plaçait l'agrégateur dans le MVP ; l'argument confondait
*encaisser* et *automatiser l'encaissement*.

> ⚠ **Alerte pour tout agent** : intégrer NotchPay, CinetPay, Flutterwave,
> Stripe ou tout autre prestataire de paiement **contredit cet ADR**. Suspendre
> et escalader. Le déclencheur de la Phase 3 est un volume d'environ
> 5 réservations par jour, pas une envie d'automatiser.

**Coût assumé** : ne passe pas l'échelle ; introduit un délai entre paiement et
blocage, qui doit être annoncé à l'écran ; et pose une question juridique et
fiscale réelle sur la réception de fonds, **non traitée à ce jour**.

### 2. Pas de messagerie interne

Après confirmation de l'avance, le numéro WhatsApp de l'hôte est révélé.
WhatsApp est le canal réel de Douala — le CDC §1 le décrit lui-même comme le
canal existant. Le reconstruire coûte cher pour un résultat inférieur.

La mécanique anti-désintermédiation d'[ADR-007](ADR-007-modele-economique-avance-en-ligne.md)
est préservée : elle repose sur **le moment** de la révélation, pas sur le canal.

> ⚠ Le CDC §4 liste la messagerie comme capacité du locataire. C'est un écart
> assumé, pas un oubli.

### 3. Les propriétaires ne créent pas leurs annonces au MVP

L'administration crée et modifie les annonces. Motif : l'amorçage impose de
saisir et photographier les 30 à 50 premières nous-mêmes. Construire l'outil
d'auto-publication avant d'avoir un seul propriétaire autonome, c'est construire
à l'aveugle — et on apprendra ce dont ils ont besoin en le faisant à leur place.

## Alternatives rejetées

**MVP complet conforme au CDC.** Rejetée : couvre 19 exigences dont aucune ne
teste l'hypothèse, face à un concurrent qui a déjà tout cela.

**MVP sans paiement du tout**, simple mise en relation. Rejetée : une
réservation qu'on ne peut pas sécuriser n'est pas une réservation, c'est un
contact. Et le taux d'abandon devant l'avance est l'information la plus chère du
projet — la reporter, c'est se priver de la seule donnée qui compte.

## Conséquences

**Positives.** Périmètre réduit à ce qui valide ou invalide le produit. Le
parcours de paiement est testé en conditions réelles dès le MVP.

**Négatives.** Le MVP n'est pas vendable en l'état à un investisseur qui
regarderait la couverture fonctionnelle. C'est assumé : il est fait pour
apprendre, pas pour impressionner.

## Artefacts liés

- [PRD v1.0](../../documentation/PRD.md) §4.3, §4.4, §7
- ADR-005, ADR-007 · Skills : `product/define_mvp`, `memory/recall_context`
