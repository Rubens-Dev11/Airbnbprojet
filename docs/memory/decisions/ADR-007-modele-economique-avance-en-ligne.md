# ADR-007 — Modèle économique : avance en ligne, solde à l'arrivée

- **Statut** : Acceptée sur le principe, **chiffres non verrouillés**
- **Date** : 2026-08-07
- **Domaine** : Business

## Contexte

Décision du fondateur : aller sur le même modèle que PUOL, le différenciateur
étant l'IA (ADR-005). Le modèle de PUOL a été **observé directement** sur une
capture de son écran de politique de paiement :

> avance en ligne pour confirmer la réservation et bloquer les dates, solde
> réglé directement à l'hôte à l'arrivée, avance explicitement non
> remboursable, écran d'acceptation obligatoire.

Ce n'est pas une convention arbitraire, c'est la réponse locale à deux
réalités : la bancarisation est faible, et personne ne paie 100 % d'avance à un
inconnu rencontré en ligne. `plan.md` §5.2 était arrivé à la même conclusion
indépendamment.

## Décision

**Avance en ligne pour confirmer et bloquer les dates, solde à l'arrivée chez
l'hôte.** La commission de la plateforme est prélevée **sur l'avance** : la
plateforme se paie à la source, elle n'a rien à recouvrer ensuite.

Corollaire indissociable — la **mécanique anti-désintermédiation** : les
coordonnées exactes de l'hôte (téléphone, adresse précise) restent masquées
jusqu'au paiement de l'avance. Sans cela, la plateforme est un annuaire gratuit
et n'encaisse rien. Ce n'est pas un détail d'implémentation, c'est ce qui
décide si le modèle tient.

## Taux d'avance : 20 % — décidé le 22 août 2026

**Décision du fondateur**, sur un argument de marché que je n'avais pas :

> « le taux d'avance c'est 20 % (par défaut pour l'instant), sinon aucun hôte
> n'acceptera, c'est cher »

C'est un raisonnement sur l'acceptabilité côté **hôte**, pas côté locataire —
angle absent de `plan.md`, qui proposait 30 % en raisonnant uniquement sur le
besoin de trésorerie de la plateforme. Un taux que les propriétaires refusent
ne rapporte rien, quel que soit son niveau.

Marqué « par défaut pour l'instant » : c'est une valeur de travail, pas un
arbitrage définitif. Elle vit dans `apps/web/src/lib/pricing.ts`, pilotée par
`DEPOSIT_RATE_PERCENT`, à un seul endroit — et **jamais confiée à un modèle de
langage**, qui en inventerait un (constaté le 22 août : l'agent annonçait
« généralement 10 % » de sa propre initiative).

À reprendre après les premiers retours de propriétaires réels.

## Ce qui n'est PAS décidé ici, et pourquoi

`plan.md` §5 propose des chiffres précis : avance de 30 %, commission de 10 %,
frais de service de 3 % plafonnés à 5 000 FCFA, panier moyen de 88 000 FCFA,
point mort au mois 7-9.

**Ces chiffres ne sont pas repris**, pour une raison vérifiable : le panier
moyen repose sur une nuitée à 22 000 FCFA, alors que **le seul prix réellement
observé dans ce dépôt est une annonce PUOL à 16 500 FCFA la nuit** — 25 % en
dessous. Un seul point de mesure ne fait pas un marché, mais il suffit à
interdire de bâtir un point mort dessus.

À établir avant de figer quoi que ce soit :

| Donnée | Comment l'obtenir |
|---|---|
| Prix réel des nuitées à Douala, par quartier | Relevé sur le catalogue PUOL et sur les groupes WhatsApp existants |
| Taux d'avance acceptable par les locataires | Ce que PUOL applique, observable dans son parcours |
| Commission acceptable par les propriétaires | Entretiens lors de l'amorçage de l'offre |
| Frais réels de l'agrégateur Mobile Money | Grille tarifaire du prestataire retenu |

## Ce qui reste ouvert

- **L'agrégateur de paiement.** `plan.md` recommande NotchPay, avec CinetPay en
  repli. **Ni l'existence, ni les tarifs, ni les conditions d'accès, ni le délai
  d'intégration annoncé n'ont été vérifiés.** À faire avant toute décision.
- **Le paiement est-il dans le MVP ?** Argument pour : sans encaissement, aucun
  revenu et rien n'empêche de traiter hors plateforme. Argument contre :
  intégration, webhooks, réconciliation, échecs, reversements — et un volet
  juridique inexistant. Tranché dans le PRD (ADR-001).
- **Le volet juridique.** Encaisser pour le compte de tiers n'est pas une
  fonctionnalité, c'est une activité. Conditions générales, données
  personnelles, statut des fonds détenus, politique d'annulation : **rien
  n'existe, ni au CDC, ni dans `plan.md`.** PUOL, lui, affiche déjà une
  politique écrite.

## Alternatives rejetées

**Paiement intégral en ligne**, comme Airbnb. Rejetée : inadaptée au niveau de
bancarisation et de confiance locale. Le concurrent installé ne le fait pas
non plus.

**Paiement intégralement à l'arrivée**, sans avance. Rejetée : ne bloque rien,
ne garantit rien, et la plateforme n'a aucun moyen de percevoir sa commission.
C'est le modèle du groupe WhatsApp, que le produit est censé remplacer.

## Conséquences

**Positives.** Aligné sur les usages locaux et sur ce qu'un concurrent en
service a déjà validé. La plateforme est payée à la source.

**Négatives, assumées.** Une avance non remboursable est un engagement fort
demandé à l'utilisateur : elle doit être expliquée en toutes lettres avant
paiement, et opposable ensuite. Cela suppose des conditions générales réelles
et un support capable de traiter les litiges — deux choses qui n'existent pas
encore.

## Artefacts liés

- ADR-005, `docs/veille-concurrence.md`, `plan.md` §5 §6
- Skills : `strategy/generate_business_model`
