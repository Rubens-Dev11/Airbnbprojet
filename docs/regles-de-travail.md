# Règles de travail

Document de méthode. Il ne décrit aucune fonctionnalité : il fixe **comment** on
travaille sur ce projet, quelle que soit la tâche demandée.

Ces règles s'appliquent automatiquement à toute instruction, qu'elles soient
rappelées ou non dans la demande.

---

## 1. La règle absolue

Pour **chaque étape** de **chaque tâche**, sans exception :

1. **Lire l'état réel avant d'agir** — le code, le comportement en cours, la
   sortie de la commande précédente.
2. **Exécuter la tâche.**
3. **Lire le résultat complet et réel** — logs, build, tests, rendu à l'écran.
   Jamais un résumé supposé, jamais une extrapolation.
4. **Si conforme** → étape suivante.
5. **Si non conforme** → diagnostiquer la cause, corriger, retester depuis (3).
6. **Ne jamais passer à l'étape suivante** sans validation confirmée par une
   lecture réelle.
7. **Ne jamais déclarer une étape terminée** sans avoir lu la sortie réelle de la
   commande ou du test correspondant.

Cette règle prime sur la vitesse. Une tâche plus lente mais vérifiée à chaque
étape vaut mieux qu'une tâche rapide et non validée.

---

## 2. Un signal partiel ne prouve rien

C'est la source d'erreur la plus fréquente, et la plus coûteuse : croire qu'un
indicateur vert vaut preuve.

- **Un code HTTP ne prouve pas qu'une ressource existe.** Un repli applicatif
  peut renvoyer 200 en servant tout autre chose. Vérifier le `content-type`, la
  taille, ou le contenu.
- **Un typecheck à zéro et des tests au vert ne prouvent pas qu'un parcours
  fonctionne.** Ils prouvent que le code compile et que ce qui est testé passe.
- **Un build réussi ne prouve pas qu'une fonctionnalité marche.**
- **Ne jamais interroger un service depuis la machine qui l'héberge** quand on
  cherche à savoir ce que voit l'extérieur : le résolveur local, le fichier
  `hosts` ou un cache fausseront la réponse. Interroger depuis l'extérieur.
- **Comparer des empreintes, pas des dates ou des tailles**, pour affirmer que
  deux fichiers sont identiques.

Quand une preuve est indirecte, le dire. « Je n'ai pas pu vérifier X » est une
information utile ; « X fonctionne » sans l'avoir vu est une faute.

---

## 3. Reprendre un travail déjà commencé : auditer avant de continuer

Si la tâche porte sur la poursuite, la correction ou la revue d'un travail
entamé — par quelqu'un d'autre ou par une session précédente :

- **Ne jamais supposer qu'une chose est acquise** parce qu'elle est présentée
  comme terminée dans un commentaire, un message, un nom de fichier ou un
  ticket.
- **Vérifier chaque critère individuellement** contre le code réel : lecture, et
  exécution quand c'est possible.
- **Produire un état des lieux avant d'enchaîner** : complet / partiel / absent,
  avec pour chaque point la preuve concrète — fichier consulté, test réalisé,
  résultat observé.
- **Si une partie supposée terminée est en réalité cassée, le signaler**, ne pas
  la corriger en silence. Demander confirmation si le correctif est conséquent.

Corollaire : avant d'écrire une ligne, vérifier que le travail n'existe pas
déjà. Relire l'état du dépôt, y compris les modifications non commitées.

---

## 4. Ne rien inventer

- **Ne jamais afficher une information qui n'est pas vérifiée** côté serveur ou
  côté source de vérité.
- Si une donnée n'a pas d'équivalent réel, **l'omettre plutôt qu'afficher une
  valeur fausse**. Une case vide est honnête ; une donnée plausible et fausse ne
  l'est pas.
- Ne jamais laisser de données de démonstration se faire passer pour des données
  réelles. Elles survivent toujours plus longtemps que prévu.
- Ne pas annoncer une garantie que le code n'applique pas.

---

## 5. Ne rien casser

- Tenir la **liste des fonctionnalités critiques** qui ne doivent jamais
  régresser. La vérifier **avant et après** chaque modification.
- Toute régression détectée doit être **signalée explicitement**, jamais corrigée
  en silence.
- Respecter le **système de design existant** plutôt que d'introduire un nouveau
  style visuel.

---

## 6. Avant de toucher au moindre fichier

- Explorer le code pour localiser précisément les fichiers concernés.
- **Ne jamais supposer** un nom de fichier, un nom de composant ou un champ de
  schéma : le vérifier dans le dépôt avant d'écrire.
- Une même page peut exister en plusieurs copies. Un correctif appliqué à la
  mauvaise copie ne produit aucun effet visible, et fait perdre des heures.

---

## 7. Actions irréversibles et production

- **Lecture seule par défaut** sur les serveurs.
- **Rien d'irréversible sans accord explicite** : redémarrage de service,
  migration, modification de configuration, suppression, envoi vers l'extérieur.
- **Sauvegarder avant d'écraser ou de supprimer.** Placer les sauvegardes **hors
  du répertoire servi** : un fichier de sauvegarde laissé dans une racine web
  devient publiquement téléchargeable.
- **Sauvegarder la base avant toute migration.**
- **Savoir ce qu'un déploiement déclenche.** Si pousser applique
  automatiquement les migrations, alors pousser une migration, c'est l'appliquer
  en production.
- Préférer **fournir les commandes** à exécuter plutôt qu'agir directement sur la
  production.
- Une autorisation vaut pour **une action et une session**. Elle ne se généralise
  pas à la suivante.

---

## 8. Secrets

- **Ne jamais recopier un fichier de configuration de production** dans une
  conversation, un ticket ou un message. Un secret publié ne se dépublie pas.
- Donner la **commande pour le lire** plutôt que son contenu.
- Quand il faut montrer la forme d'un fichier : afficher les **noms** des clés,
  masquer les valeurs sensibles.
- Ne jamais committer de secret. Vérifier que les fichiers de configuration sont
  bien ignorés par le gestionnaire de versions.

---

## 9. Versionnement

- **Un commit distinct par tâche**, avec un message clair.
- Le message explique **pourquoi**, pas seulement quoi. Le quoi est dans le diff ;
  le pourquoi disparaît avec la personne qui l'a écrit.
- **Ne jamais indexer en aveugle.** Ajouter les fichiers explicitement : un
  `add` global emporte le travail en cours de quelqu'un d'autre.
- Quand on importe un existant non versionné, **committer d'abord l'état tel
  quel**, puis les modifications : le diff devient lisible.
- Vérifier avant de pousser ce que la branche déclenche.

---

## 10. Documentation

- Un **journal des modifications** tenu à jour, qui consigne le raisonnement
  derrière chaque correctif — pas seulement la liste des changements.
- Un **document de reprise** décrivant l'état réel, les pièges connus et ce qui
  reste à faire. Tout ce qui y figure doit avoir été constaté, pas déduit.
- Si deux documents couvrent la même matière et ne sont pas générés l'un depuis
  l'autre, **les mettre à jour ensemble**.
- Consigner les erreurs des documents eux-mêmes quand on les découvre : un
  document faux coûte plus cher que pas de document.

---

## 11. Livrables attendus à la fin de chaque tâche

1. Liste des fichiers créés et modifiés.
2. Migrations éventuelles.
3. Tests — automatisés, ou à défaut scénarios manuels documentés.
4. **Note explicite sur toute hypothèse prise** faute d'information : un champ
   supposé, une valeur choisie par défaut, un comportement deviné.
5. Ce qui n'a pas été fait, et pourquoi.

---

## 12. Communication

- **Rapporter fidèlement.** Si un test échoue, le dire avec la sortie. Si une
  étape a été sautée, le dire. Si c'est fait et vérifié, l'affirmer sans
  précaution inutile.
- **Signaler ce qu'on trouve en chemin** sans l'inclure d'office dans la tâche.
  Le périmètre demandé est le livrable ; élargir ou réduire est une décision du
  demandeur.
- Ne pas se corriger pour des détails sans conséquence. Corriger clairement ce
  qui change une décision.
- Poser une question **quand deux lectures mènent à des travaux différents**.
  Sinon, décider, l'annoncer, et avancer.

---

## Pièges génériques, constatés

Ils ne dépendent d'aucune technologie particulière.

| Piège | Ce qu'il produit |
|---|---|
| Arbres de fichiers dupliqués | Un correctif appliqué à une copie morte, sans effet visible |
| Règle d'exclusion trop large dans le gestionnaire de versions | Un fichier nécessaire jamais livré — et la fonctionnalité muette en production |
| Artefacts de build à côté des sources | Un fichier périmé masque la source ; le comportement ne suit plus le code |
| Dérive entre le schéma et les migrations | Toute base reconstruite est incomplète ; les tests passent, la production casse — ou l'inverse |
| Clés étrangères en restriction là où on croyait une cascade | La suppression échoue dès que l'entité a la moindre dépendance |
| Conversion automatique des fins de ligne | Le fichier versionné ne correspond plus, octet pour octet, à ce qui est déployé |
| Rechargement automatique sans garde-fou | Une boucle de rechargement infinie |
| Dépendance ajoutée sans mise à jour du verrou | Le build casse si l'installation est en mode strict |

---

## Ce qui compte, en une phrase

**Lire l'état réel avant d'agir, lire la sortie réelle après avoir agi, et ne
jamais afficher une information qu'on n'a pas vérifiée.**

Tout le reste en découle.

---

## Application constatée sur ce dépôt

Les pièges ci-dessus ne sont pas théoriques ici. Trois se sont déjà produits, et
sont documentés avec leur preuve dans `etat-des-lieux.md` :

| Piège de la liste | Ce qu'il a produit sur ce dépôt |
|---|---|
| Conversion automatique des fins de ligne | `core.autocrlf = true` sans `.gitattributes` (C-04) |
| Règle d'exclusion — ici, son absence totale | Aucun `.gitignore` à la veille d'introduire des clés API (C-03) |
| Travail présenté comme acquis sans vérification | Un plan stratégique complet oublié sur une branche distante jamais fusionnée (C-07, §5) |
