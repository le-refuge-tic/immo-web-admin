# Journal des modifications

Toutes les modifications notables de l'interface d'administration REFUGE (`immo-web-admin`).
Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Non publié]

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
