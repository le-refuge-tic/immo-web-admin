# Validation des formulaires — administration (lot 15)

Ce document recense chaque formulaire de `immo-web-admin` et la règle de chacun de ses champs. Il sert de référence pour garder le front aligné sur le backend : les DTO NestJS font foi, et le front reproduit leurs règles.

## Règles communes

**Saisie des champs.** Les composants de `src/shared/saisie/champs.tsx` (fichier identique dans immo-web-user) remplacent les `<input type="number">` et les champs téléphone libres.

| Composant | Ce qu'il fait |
|---|---|
| `NumberInput` | Champ texte au clavier numérique. N'accepte que des chiffres, à la frappe comme au collage. `max` bloque la saisie au-delà ; `decimales` autorise une virgule. |
| `MoneyInput` (ou `milliers`) | Affiche les milliers séparés (« 150 000 ») mais renvoie la valeur brute (`150000`). |
| `PhoneInput` | Garde 10 chiffres au plus. Retire l'indicatif s'il est collé (`+229`, `00229`, `229`). `indicatif` affiche « +229 » devant le champ. |
| `EmailInput`, `TexteInput`, `DateInput` | E-mail limité à 255 caractères ; texte borné par `maxLength` ; date avec `futur` pour refuser les dates passées. |

**Schémas.** Les briques zod sont dans `src/shared/saisie/schemas.ts` :
- `zMontant` : entier ≥ 1 ;
- `zNombre` et `zNombreFacultatif` : nombre borné ;
- `zTelephone` : 01 + 8 chiffres, envoyé au format `+229…` ;
- `zEmail` ;
- `zTexte(max, min)` ;
- `zNomReel` : règle `NOM_REEL` du backend ;
- `zDate` ;
- `zMotDePasse` : 8 à 128 caractères.

Les schémas propres à l'administration sont dans `src/validation/schemas.ts` et testés dans `schemas.test.ts`.

**Hook `useValidation`** (`src/shared/saisie/validation.ts`) :
- l'erreur s'affiche sous le champ quand on le quitte, et sur tous les champs à la soumission ;
- le focus va au premier champ en erreur ;
- l'envoi n'a lieu qu'une fois : le bouton est désactivé pendant l'envoi ;
- les messages de l'API sont rattachés au bon champ (`erreursDuServeur`).

**Contrôle `npm run check:inputs`.** Le script échoue si un `<input type="number">` brut, un `type="tel"` ou un champ téléphone libre réapparaît.

## Inventaire

Légende de la colonne « Schéma » :
- ✅ : schéma zod et erreurs sous les champs ;
- 🔹 : règles déjà en fonctions pures testées (gardées telles quelles) ;
- — : pas de saisie libre.

| Formulaire (fichier) | Champ | Type et bornes | Obligatoire | Message d'erreur | Schéma |
|---|---|---|---|---|---|
| Connexion (`login/LoginPage`) | email | e-mail ≤ 255 | oui | « Adresse e-mail invalide. » | ✅ `schemaConnexion` |
| | mot de passe | ≤ 128 | oui | « Saisissez votre mot de passe. » | ✅ |
| | code SMS | 6 chiffres | oui (2ᵉ étape) | « Entrez le code à 6 chiffres reçu par SMS. » | ✅ `schemaCodeOtp` |
| Changement de mot de passe (`components/ChangePasswordForm`) | actuel / nouveau / confirmation | nouveau : 8 à 128 ; confirmation identique | oui | indications sous les champs | ✅ `schemaChangementMotDePasse` (bouton) |
| Profil (`configuration/ProfilEditModal`) | nom, prénom | lettres, 2 au moins, ≤ 100 (`NOM_REEL`) | oui | « Saisissez votre vrai nom… » | ✅ `schemaProfil` |
| | e-mail | e-mail | non | « Adresse e-mail invalide. » | ✅ |
| Téléphone obligatoire / vérification (`components/PhoneRequiredModal`, `VerifyPhoneSection`) | numéro | `PhoneInput`, 01 + 8 chiffres | oui | message existant | 🔹 longueur et préfixe vérifiés |
| Nouveau commercial, nouvel admin (`configuration/NouveauCompteModal`) | nom, prénom | 2 à 100 | oui | « Au moins 2 caractères. » | ✅ `schemaNouveauCompte` |
| | e-mail | e-mail ≤ 255 | oui | « Adresse e-mail invalide. » | ✅ |
| | mot de passe / confirmation | 8 à 128 ; identiques | oui | « Les mots de passe ne correspondent pas. » | ✅ |
| Bonus commercial (`configuration/GestionCommercialPage`) | montant | `MoneyInput`, 1 à 99 999 999 | oui | « Le montant doit être au moins 1. » | ✅ `schemaBonus` |
| | motif | 3 à 255 | oui | « Au moins 3 caractères. » | ✅ |
| Frais de visite (`configuration/GestionFraisVisitePage`) | montant | `MoneyInput`, 0 à 100 000 | oui | « Le tarif ne peut pas dépasser 100 000. » | ✅ `schemaFraisVisite` |
| Modération (`moderation/ModerationPage`) | frais de visite | `MoneyInput`, 0 à 999 999 | oui (approbation) | « Les frais… » | ✅ `schemaFraisModeration` |
| | motif de refus | 5 à 500 | oui (refus) | « Au moins 5 caractères. » | ✅ `schemaMotifRefus` |
| Décision motivée (`annonces/DialogueDecision`) | motif ou conditions | texte borné | oui | message existant | 🔹 |
| Coordonnées du propriétaire (`annonces/AnnonceDetailPage`, `commercial/MesAnnoncesPage`) | prénom, nom | 2 à 100 | oui | « Au moins 2 caractères. » | ✅ `schemaProprietaire` |
| | téléphone | `PhoneInput`, 01 + 8 chiffres | oui | « Numéro invalide : saisissez 10 chiffres commençant par 01… » | ✅ |
| | e-mail | e-mail | non | « Adresse e-mail invalide. » | ✅ |
| Validation d'une mise en gestion (`gestion/GestionLiaisonsPage`) | date de début | date | oui | « Ce champ est obligatoire. » | ✅ `schemaLiaison` |
| | jour d'échéance | 1 à 28 | oui | « … ne peut pas dépasser 28. » | ✅ |
| | mois prépayés | 0 à 12 | oui | « … ne peut pas dépasser 12. » | ✅ |
| | notes | ≤ 1 000 | non | — | ✅ |
| Numéro de retrait (`commercial/NumeroRetraitModal`) | numéro | `PhoneInput`, 01 + 8 chiffres | oui | message existant | 🔹 `numeroValide` |
| Retrait (`commercial/RetraitRequestModal`) | montant | `MoneyInput` ; minimum et solde | oui | messages existants | 🔹 `retraitCommercial.ts` |
| Publication : bien classique, guesthouse, salle (`commercial/Publier*`, `shared/biens/formulaires`) | prix, capacités, surfaces | `NumberInput` / `MoneyInput` bornés | selon l'étape | messages de chaque étape | 🔹 `manquesEtape` (téléphone du propriétaire : règle béninoise) |
| Édition d'annonce (`annonces/AnnonceEditPage`) | tarifs, prix, surfaces, compteurs | `SNombre` (`NumberInput`), décimales pour les surfaces | selon le type | contrôles existants | 🔹 |
| Historique (`finances/HistoriqueFiltres`) | n° utilisateur, n° bien, montants | `NumberInput` / `MoneyInput` | non | — (filtres) | — |

## Écarts relevés avec le backend
- `POST /wallets/me/numero-retrait/initier` (`InitierChangementNumeroDto`) accepte encore 8 à 10 chiffres. Les fronts exigent 01 + 8 chiffres, la règle du reste de l'API (`common/telephone.util.ts`). À aligner côté backend, après accord, à cause de l'app mobile.
- `proprietaire_info.telephone` (dans `amenites`, en JSON) n'est pas validé par le backend. Seuls les fronts appliquent la règle béninoise.
