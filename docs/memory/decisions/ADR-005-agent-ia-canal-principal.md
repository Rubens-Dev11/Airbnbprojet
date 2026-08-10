# ADR-005 — L'agent IA est le canal de réservation principal

- **Statut** : Acceptée
- **Date** : 2026-08-07
- **Domaine** : Produit
- **Remplace** : l'arbitrage ouvert D-01 de `docs/decisions.md`

## Contexte

Décision du fondateur : *« on peut aller sur le même modèle [que PUOL], ce qui
fera la différence c'est l'IA qu'on aura chez nous. »*

C'est un positionnement clair et il a le mérite d'être testable. Il a aussi une
conséquence que le CDC n'avait pas tirée : **si l'IA est le différenciateur,
elle ne peut pas rester au sprint 5.** Un différenciateur qu'on découvre en fin
de parcours est un différenciateur qu'on découvre trop tard — s'il ne tient pas
la route sur de vraies requêtes en français camerounais, tout le reste du
produit a été construit sur une hypothèse invalidée.

Le CDC §5.3 place l'agent IA au sprint 5, comme fonctionnalité parmi d'autres.
`plan.md` §4.1 avait déjà proposé l'inverse : *« l'expérience conversationnelle
EST le produit »*.

## Décision

**L'agent conversationnel est le canal de réservation principal.** La
navigation classique — grille, filtres, carte — reste disponible en second
canal, pour ceux qui la préfèrent et pour le référencement.

Trois règles qui en découlent, opposables à toute décision produit ultérieure :

1. **Parité fonctionnelle.** Tout ce qui se fait au formulaire doit pouvoir se
   faire en conversation : chercher, comparer, vérifier une disponibilité,
   poser une question sur un quartier, initier une réservation.
2. **Prototype avant tout le reste.** Un prototype jetable de l'agent, branché
   sur des données réelles, doit tourner **avant** que le catalogue et la
   réservation soient construits. Objectif unique : savoir s'il comprend de
   vraies demandes en français, avec les formulations et les noms de quartiers
   réellement employés à Douala.
3. **Indicateur de pilotage.** La part de réservations initiées via l'agent est
   l'indicateur qui valide ou invalide ce positionnement. Cible à fixer dans le
   PRD. S'il reste durablement bas, le différenciateur n'en est pas un, et cet
   ADR devra être remplacé plutôt que défendu.

## Ce que cette décision ne dit pas

Elle ne dit pas que PUOL n'a pas d'IA. **Ce point n'a pas été vérifié** :
aucune des captures consultées ne montre d'assistant conversationnel, mais
aucune ne prouve son absence. Fonder un positionnement sur une absence non
constatée serait refaire l'erreur du CDC §2.

Elle ne dit pas non plus que la découverte doit copier PUOL. Leur fil vidéo
vertical est un choix cohérent quand le catalogue est jeune : un moteur de
recherche sur dix annonces ne renvoie que des résultats vides, un fil montre
toujours quelque chose. La même contrainte nous attend au lancement. À traiter
dans le PRD, pas ici.

## Alternatives rejetées

**Segment différent** (moyenne durée, expatriés, entreprises). Rejetée par le
fondateur : même modèle que PUOL.

**Le web indexable comme différenciateur principal.** Rejetée comme axe
*principal* — mais conservée comme avantage secondaire réel : c'est ce qui
justifie Next.js dans ADR-003.

**Garder l'IA au sprint 5, comme au CDC.** Rejetée : incompatible avec le fait
d'en faire le différenciateur.

## Conséquences

**Positives.** Un positionnement clair, un indicateur qui le valide ou l'infirme,
et un ordre de construction qui met le risque le plus élevé en premier.

**Négatives, assumées.**

- Le coût par conversation devient un coût **produit**, pas un coût
  accessoire. Sans plafond ni mesure, il n'est pas pilotable — et aucun budget
  n'existe à ce jour.
- La latence de l'agent devient une contrainte de premier rang sur une
  connexion 3G. Le CDC §8.3 vise moins de 3 secondes avec affichage progressif.
  **Cible non vérifiée**, à mesurer sur le prototype depuis une connexion
  réelle, pas depuis le poste de développement.
- Un agent qui comprend mal en français camerounais tue le produit. C'est
  précisément ce que le prototype doit établir avant qu'on construise dessus.

## Artefacts liés

- ADR-003 (l'agent vit dans une route serveur Next.js), ADR-007
- `docs/veille-concurrence.md`, CDC §5.3 §8.3, `plan.md` §4.1
