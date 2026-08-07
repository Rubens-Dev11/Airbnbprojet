# Veille concurrentielle

Ce document ne consigne que des faits **observés**. Ce qui relève de la
supposition est marqué comme tel.

---

## PUOL — concurrent direct en service sur le marché cible

**Observé le** : 7 août 2026, à partir de 27 captures d'écran déposées dans
`InspirationsMaquettes/` (noms de fichiers WhatsApp datés du 17 juillet 2026,
horloge du téléphone visible entre 03:32 et 03:43).
**Support** : application mobile Android, interface en français.
**Méthode** : lecture directe de 5 captures, choisies pour couvrir des écrans
distincts. Les 22 autres n'ont pas été ouvertes une à une.

### Ce qui a été vu à l'écran

| Domaine | Observation |
|---|---|
| Découverte | Fil vertical plein écran, style réseau social vidéo. Deux onglets : « Explorer » et « Pour toi ». Compteurs de likes, commentaires, partages sur chaque annonce. |
| Annonce | « Chambre meublé » à « Carrefour Andem ». Badges : Chambre · Meublé · 2 personnes. Prix affiché **« 16 500 FCFA (≈ 25 €) / NUIT »**. Bouton « DÉCOUVRIR L'OFFRE ». |
| Fiche détaillée | Quartier « Bepanda Tapis Rouge ». Attribut « Proximité de la route : En bord de route ». Description rédigée par l'annonceur, avec mention explicite que seule l'interface suit la langue de l'appareil. |
| Confiance | Badge **« Cette Annonce a été vérifiée et est disponible »**, avec pastille de vérification sur l'avatar de l'annonceur. |
| Tarification | « Offre spéciale pour long séjour — 7 nuits réservées → 10 % de remise ». |
| Réservation | Boutons « Réserver le logement » et « Envoyer un message ». |
| Paiement | Écran **« Politique de paiement et de remboursement »** : avance en ligne pour confirmer la réservation et bloquer les dates, solde réglé directement à l'hôte à l'arrivée, avance **non remboursable**, validation par « J'ai lu et j'accepte ». |
| Navigation | Accueil · Visites · bouton de publication central · Favoris · Profil. |
| Favoris | Écran « Mes favoris » avec filtres par type et par date, et état vide rédigé. |
| Profil | Publications, followers, suivis, vues, likes, commentaires, réservations, avis. |
| Fidélisation | Programme **« Ambassadeur PUOL — code promo, wallet et parrainages »**. |

### Lecture

PUOL n'est pas une maquette ni un prototype : c'est un produit exploité, avec
des annonces réelles, un parcours de réservation complet et une politique
commerciale écrite. Trois choses en particulier méritent attention.

1. **La découverte se fait par un fil vidéo, pas par une barre de recherche.**
   C'est un choix fort, adapté à un usage mobile et à un catalogue jeune : quand
   il y a peu d'annonces, un moteur de recherche renvoie surtout des résultats
   vides, alors qu'un fil montre toujours quelque chose.
2. **Le paiement est hybride** : avance en ligne, solde à l'arrivée. C'est la
   réponse pragmatique au faible taux de bancarisation et à la méfiance envers
   le paiement intégral en ligne. Le CDC ne décrit rien d'équivalent.
3. **La confiance est un produit à part entière** : annonces vérifiées, avatars
   certifiés, avis, programme d'ambassadeurs. Le CDC §1 identifie bien la
   défiance comme problème central mais n'y répond, côté v1.0, par aucun
   mécanisme concret.

### Ce qui n'a pas pu être vérifié

- Volume réel d'annonces, couverture géographique, ancienneté du produit.
- Existence d'un paiement Mobile Money (MTN MoMo, Orange Money).
- Existence d'un assistant conversationnel.
- Existence d'une version web.
- Modèle économique : commission, abonnement, mise en avant payante.
- Structure derrière le produit, et son financement.

Ces points doivent être établis **avant** l'arbitrage D-01 de `decisions.md`.
Une manière directe de les obtenir : installer l'application et parcourir le
catalogue.

### Conséquence sur les documents de référence

**Deux documents portent aujourd'hui une affirmation fausse.**

1. **CDC v2.0 §2**, encadré « Opportunité identifiée » : « Aucune plateforme
   spécialisée n'existe pour Douala avec : paiement Mobile Money, interface en
   français, assistant IA en langue locale ». À corriger, et la section « Étude
   de l'existant » à compléter d'une ligne PUOL.
2. **`plan.md` §1.2** (branche `check-github-repo-airbnbprojet`) : « Opportunité
   marché validée : aucun concurrent local avec Mobile Money + français + IA ».
   C'est la reprise du CDC sans vérification indépendante.

**Chronologie, pour être juste avec ces documents.** Le fichier du CDC date du
12 mai 2026, `plan.md` du 9 juillet 2026, les captures PUOL du 17 juillet 2026.
Aucun des deux n'avait l'information au moment de sa rédaction. Ce qui est
fautif, ce n'est pas de l'avoir écrit — c'est que trois semaines plus tard, la
preuve du contraire dorme non versionnée dans le dépôt sans que rien n'ait
bougé.

**Ce qui reste ouvert** : les deux documents affirment aussi que le concurrent
manquant n'aurait ni Mobile Money ni IA. Sur PUOL, **je n'ai pu vérifier ni
l'un ni l'autre** : aucune capture ne montre d'écran de paiement Mobile Money
ni d'assistant conversationnel. L'affirmation « PUOL n'a pas d'IA » serait
aussi peu fondée que celle qu'elle remplace.

---

## Références internationales — déjà couvertes par le CDC

Airbnb et Booking.com sont analysés au CDC §2. Le dépôt contient par ailleurs
23 captures du parcours de réservation d'Airbnb en français
(`fluxdereservation/`) et la fiche Play Store d'Airbnb
(`infoAirbnbPlaystore/AboutAirbnb.txt`). Ce matériau est une référence
**d'ergonomie**, pas de positionnement : Airbnb ne concurrence pas ce projet à
Douala, PUOL si.
