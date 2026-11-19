/**
 * Lot 15 — schémas de validation des formulaires de l'administration. Mêmes règles que les
 * DTO du backend (longueurs, bornes, téléphone béninois) ; inventaire complet dans
 * docs/VALIDATION_FORMULAIRES.md.
 */
import { z } from 'zod'
import { zDate, zEmail, zMontant, zMotDePasse, zNombre, zNomReel, zTelephone, zTexte, zTexteFacultatif } from '../shared/saisie/schemas'

const emailFacultatif = () =>
  z.string().trim().optional().transform((v, ctx) => {
    if (!v) return undefined
    const r = zEmail().safeParse(v)
    if (r.success) return r.data
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: r.error.issues[0].message })
    return z.NEVER
  })

/** Coordonnées du propriétaire d'un bien publié par le personnel. */
export const schemaProprietaire = z.object({
  prenom: zTexte(100, 2),
  nom: zTexte(100, 2),
  telephone: zTelephone(),
  email: emailFacultatif(),
})

/** Création d'un compte du personnel (commercial ou admin) : mêmes règles que les DTO. */
export const schemaNouveauCompte = z
  .object({
    nom: zTexte(100, 2),
    prenom: zTexte(100, 2),
    email: zEmail(),
    password: zMotDePasse(),
    confirm: z.string(),
  })
  .refine(v => v.password === v.confirm, { path: ['confirm'], message: 'Les mots de passe ne correspondent pas.' })

/** Bonus accordé à un commercial (`AccorderBonusDto` : montant ≥ 1, motif 3 à 255). */
export const schemaBonus = z.object({
  montant: zMontant({ max: 99_999_999 }),
  motif: zTexte(255, 3),
})

/** Tarif promotionnel des frais de visite (le service refuse au-delà de 100 000). */
export const schemaFraisVisite = z.object({
  montant: zNombre({ min: 0, max: 100_000, libelle: 'Le tarif' }),
})

/** Frais de visite fixés à l'approbation d'un bien (`ModerateBienDto.frais_visite` ≥ 0). */
export const schemaFraisModeration = z.object({
  frais: zNombre({ min: 0, max: 999_999, libelle: 'Les frais' }),
})

/** Validation d'une demande de mise en gestion (date de début, échéance, loyers prépayés). */
export const schemaLiaison = z.object({
  date_debut: zDate(),
  jour_echeance: zNombre({ min: 1, max: 28, libelle: 'Le jour d’échéance' }),
  loyer_prepaye_mois: zNombre({ min: 0, max: 12, libelle: 'Le nombre de mois' }),
  notes: zTexteFacultatif(1000),
})

/** Motif d'un refus de bien (`ModerateBienDto.motif_refus` ≤ 500 ; 5 caractères au moins). */
export const schemaMotifRefus = z.object({ motif: zTexte(500, 5) })

/** Connexion du personnel : l'API ne vérifie que la présence du mot de passe (≤ 128). */
export const schemaConnexion = z.object({
  email: zEmail(),
  password: z.string().min(1, 'Saisissez votre mot de passe.').max(128, '128 caractères au maximum.'),
})

/** Code reçu par SMS : exactement 6 chiffres. */
export const schemaCodeOtp = z.object({
  code: z.string().regex(/^\d{6}$/, 'Entrez le code à 6 chiffres reçu par SMS.'),
})

/** Changement de mot de passe (`nouveau_mot_de_passe` : 8 à 128 caractères). */
export const schemaChangementMotDePasse = z
  .object({
    actuel: z.string().min(1, 'Saisissez votre mot de passe actuel.'),
    nouveau: zMotDePasse(),
    confirmation: z.string(),
  })
  .refine(v => v.nouveau === v.confirmation, { path: ['confirmation'], message: 'Les mots de passe ne correspondent pas.' })

/** Modification du profil (`UpdateProfileDto` : nom réel, e-mail facultatif). */
export const schemaProfil = z.object({
  nom: zNomReel(),
  prenom: zNomReel(),
  email: emailFacultatif(),
})
