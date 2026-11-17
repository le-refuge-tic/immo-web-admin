# Journal des modifications

Toutes les modifications notables de l'interface d'administration REFUGE (`immo-web-admin`).
Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Non publié]

### Ajouté (lot 17 — historique des transactions)
- Finances › Historique détaillé (`/finances/historique`) : paiements et mouvements de
  portefeuille dans une seule liste. Onglets Tout, Mon historique, Admins, Commerciaux,
  Démarcheurs ; le super admin a aussi Loyers, Frais de visite et Autres paiements.
  - Filtres : période (raccourcis en heure du Bénin ou dates libres), type, sens, statut, rôle,
    méthode, utilisateur, bien et montant.
  - Tri par date, type, utilisateur ou montant ; totaux des opérations abouties ; pagination
    côté serveur. Tout l'état est dans l'URL.
  - Panneau de détail : références (FedaPay comprise), payeur et bénéficiaire, bien, soldes
    avant et après, explication de la prime.
  - Export CSV et Excel de la sélection ; chaque export est journalisé côté serveur.
- Lien « Historique » sur les pages Utilisateurs, Commerciaux et Administrateurs. Il n'apparaît
  que si l'utilisateur est dans le périmètre du lecteur (un admin ne voit pas les clients).
- Portefeuille : la période, les crédits ou retraits et le tri (date ou montant) sont
  appliqués par le serveur sur tout l'historique. Avant, le filtre ne portait que sur les
  lignes déjà chargées.

### Corrigé (lot 16 — portefeuille)
- Portefeuille : une erreur de l'API n'est plus affichée comme un solde à 0 (« — » et message
  avec « Réessayer ») ; historique chargé par pages de 20 (« Afficher plus »).
- Les admins touchent la prime de publication (même grille que les commerciaux) : la page
  l'indique.

### Ajouté (lot 16)
- Parité de la grille des primes avec le backend : 864 cas de référence partagés
  (`cas-grille-primes.json`), testés des deux côtés ; `npm run check:grille` vérifie la copie.

### Ajouté (lot 8 — notifications)
- Cloche des alertes dans la barre du haut : liste, « Tout marquer comme lu », lien vers la
  modération (bien à valider, modification en attente) ou vers la fiche du bien ; toast quand une
  alerte de modération arrive pendant la session. Avant, l'administration n'affichait aucune alerte.
- Tableau des notifications dans le README.

### Corrigé (lot 7 — modération)
- L'admin ne pouvait pas approuver le bien d'un propriétaire dont les photos étaient rattachées
  aux pièces : la file de modération ne comptait que les photos du bien (la fiche et l'API,
  elles, comptaient tout). Un seul comptage partagé (`src/shared/biens/approbation.ts`).
- Fiche d'annonce : le vrai message de l'API s'affiche au lieu de « Une erreur est survenue ».

### Ajouté (lot 7)
- Confirmation avant d'approuver ; « Approuver » désactivé avec le motif du blocage.
- Dialogues Rejeter / Publier sous conditions / Retirer la publication, texte obligatoire.

### Ajouté (lot 6 — brouillons sur tous les appareils)
- Brouillons des formulaires de publication (bien, guesthouse, salle) synchronisés avec le
  serveur : un commercial les retrouve sur un autre appareil ; « Mes annonces » se met à jour.
  Le navigateur sert de cache hors ligne ; les photos restent sur l'appareil. Un autre compte
  connecté sur le même navigateur ne récupère jamais ces brouillons.
- Formulaire ouvert pendant qu'une version plus récente arrive d'un autre appareil : rien n'est
  écrasé, bandeau « Charger cette version » / « Garder ma saisie ». Ouvrir un brouillon ne le
  re-date plus. Dernières saisies envoyées avant la déconnexion.

### Ajouté (lot 5 — modification des biens)
- Modération : onglet « Modifications en attente » (compteur) ; pour chaque bien, ce qui change
  entre l'annonce en ligne et la version proposée ; « Approuver » (confirmation) ou « Refuser »
  (motif obligatoire, transmis à l'auteur).
- Conversion de type par l'admin, avec la liste des données supprimées dans la confirmation :
  depuis la fiche (changement de type), vers une guesthouse ou une salle
  (`/annonces/:id/convertir/:cle`, détails obligatoires du type cible) et vers un bien classique
  depuis une guesthouse ou une salle.

### Modifié (lot 5)
- Commercial sur un bien publié : la modification part en validation (bandeau, notification) au
  lieu d'être refusée ; les photos d'un bien publié restent réservées à l'administration.
- « Enregistrer » inactif tant que rien n'a changé ; « Quitter sans enregistrer ? » au retour.

### Ajouté (lot 3 — formulaires guesthouse et salle de fêtes)
- Barre d'actions : « Annuler » (dialogue : continuer la saisie, supprimer ou garder le brouillon),
  « Changer de type » avec confirmation, « Précédent », « Suivant » / « Envoyer ».
- Brouillons multiples par type (identifiant, date, étape, libellé tiré du nom) avec menu
  « Brouillons (n) » dans chaque page ; « Mes annonces » liste tous les brouillons avec le bon
  libellé, la bonne date et un lien `?draft=<id>` vers le bon brouillon. L'ancien brouillon unique
  est repris automatiquement.
- Totaux calculés par `src/shared/biens/calculsTarifs.ts` (testé) : guesthouse (séjour minimum,
  ménage, caution, total à l'arrivée, tarifs semaine / mois et réduction implicite) ; salle (prix
  à l'heure, coût de la durée minimum, total minimum, forfaits). Aperçu en direct à l'étape Tarif.
- Récapitulatif par sections avec « Modifier » (retour à l'étape), totaux mis en valeur, champs
  manquants listés.
- Champs facultatifs : guesthouse (frais de ménage, tarifs semaine / mois, voyageurs par chambre,
  mode de réservation, politique d'annulation) ; salle (forfaits journée / week-end, pièces
  annexes, sanitaires, accès PMR, politique d'annulation).

### Modifié
- Frais de visite lus dans la configuration (`GET /configuration/frais-visite`) au lieu de 500 F
  codés en dur.

### Corrigé
- « Mes annonces » : le brouillon guesthouse affichait toujours « Guesthouse » et « Date inconnue »
  (lecture de `form.titre` qui n'existe pas).

### Ajouté (lot 2 — référentiel des types)
- Référentiel unique des types de biens (`src/shared/biens/referentielTypes.ts`, copie de
  `GET /referentiels/types-biens`, identique à immo-web-user).
- « Publier un bien » : choix du type en deux temps (catégorie en cartes, puis sous-type en
  puces) ; « Court séjour » et « Événementiel » ouvrent le formulaire dédié après confirmation
  (une annulation laisse le choix intact). Nouveau sous-type : local commercial / showroom.
- Modification d'une annonce : même sélecteur, case « Appartement meublé » ; un type en base non
  reconnu est signalé au lieu d'un choix vide (`TYPES_EDITION` et `libelleEditionDepuisBien`
  remplacés par le référentiel).

### Ajouté
- Boîtes de confirmation communes (`useConfirm`, `src/shared/dialogues`) : focus piégé, fermeture
  par Échap, bouton principal rouge pour une action destructive. Le script
  `npm run check:no-native-dialogs` refuse tout `window.confirm`, `alert` ou `prompt`.
- Envoi des photos en arrière-plan (`src/shared/uploads`) : après « Envoyer », retour immédiat à
  « Mes annonces » ; la couverture part d'abord, puis 2 photos en parallèle, puis la vidéo, avec
  2 réessais automatiques. Un indicateur suit l'envoi sur toutes les pages (« Envoi des photos de
  Villa Fidjrossè : 3/6 »), la fermeture de l'onglet est signalée, et un envoi interrompu par un
  rechargement est proposé à la reprise (fichiers gardés dans IndexedDB, effacés à la déconnexion).
  En cas d'échec : « Réessayer » ou « Compléter les photos ».
- « Mes annonces » : badge « Photos en cours » tant que le minimum de photos n'est pas en ligne.

### Modifié
- La file de modération ne montre plus les biens dont les photos ne sont pas toutes arrivées
  (`statut_medias = complet`, backend).
- Suppression d'un brouillon : boîte de confirmation au lieu de `window.confirm` ; l'échec de
  suppression d'un utilisateur s'affiche en toast au lieu d'un `alert`.
