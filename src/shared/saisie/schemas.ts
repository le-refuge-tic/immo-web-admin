/**
 * Lot 15 — briques zod communes aux schémas de formulaires. Les champs arrivent de l'état
 * des formulaires sous forme de chaînes (saisie brute) : chaque brique les convertit.
 */
import { z } from 'zod'
import { lireNombre } from './nombres'
import { estTelephoneBenin, MESSAGE_TELEPHONE, telephoneCanonique } from './telephone'

const REQUIS = 'Ce champ est obligatoire.'

type OptionsMontant = { min?: number; max?: number; entier?: boolean; libelle?: string }

const vide = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '')

/** Nombre saisi (chaîne ou nombre) → nombre ; vide refusé. */
export function zNombre({ min = 0, max, entier = true, libelle = 'La valeur' }: OptionsMontant = {}) {
  return z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .refine(v => !vide(v), REQUIS)
    .transform(v => lireNombre(v as string | number))
    .refine((n): n is number => n !== null, 'Saisissez uniquement des chiffres.')
    .refine(n => !entier || Number.isInteger(n), `${libelle} doit être un nombre entier.`)
    .refine(n => n >= min, `${libelle} doit être au moins ${min.toLocaleString('fr-FR')}.`)
    .refine(n => max == null || n <= max, `${libelle} ne peut pas dépasser ${(max ?? 0).toLocaleString('fr-FR')}.`)
}

/** Comme `zNombre`, mais un champ vide donne `undefined`. */
export function zNombreFacultatif(o: OptionsMontant = {}) {
  return z.union([z.string(), z.number(), z.null(), z.undefined()]).transform((v, ctx) => {
    if (vide(v)) return undefined
    const r = zNombre(o).safeParse(v)
    if (r.success) return r.data
    for (const i of r.error.issues) ctx.addIssue({ code: z.ZodIssueCode.custom, message: i.message })
    return z.NEVER
  })
}

/** Montant en FCFA : entier positif. */
export const zMontant = (o: OptionsMontant = {}) => zNombre({ min: 1, libelle: 'Le montant', ...o })

/** Numéro béninois → forme canonique +229XXXXXXXXXX. */
export const zTelephone = () =>
  z.string({ required_error: REQUIS }).trim().min(1, REQUIS).refine(estTelephoneBenin, MESSAGE_TELEPHONE).transform(telephoneCanonique)

export const zTelephoneFacultatif = () =>
  z.string().trim().optional().transform((v, ctx) => {
    if (!v) return undefined
    if (!estTelephoneBenin(v)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: MESSAGE_TELEPHONE })
      return z.NEVER
    }
    return telephoneCanonique(v)
  })

export const zEmail = () =>
  z.string({ required_error: REQUIS }).trim().min(1, REQUIS).max(255, 'Adresse trop longue.').email('Adresse e-mail invalide.').transform(v => v.toLowerCase())

/** Texte obligatoire, espaces retirés aux bords, longueur bornée. */
export const zTexte = (max: number, min = 1) =>
  z.string({ required_error: REQUIS }).trim().min(min, min <= 1 ? REQUIS : `Au moins ${min} caractères.`).max(max, `${max} caractères au maximum.`)

export const zTexteFacultatif = (max: number) =>
  z.string().trim().max(max, `${max} caractères au maximum.`).optional().transform(v => (v ? v : undefined))

/** Jour local AAAA-MM-JJ du navigateur. */
export const aujourdhui = (maintenant: Date = new Date()) => {
  const d = new Date(maintenant.getTime() - maintenant.getTimezoneOffset() * 60_000)
  return d.toISOString().slice(0, 10)
}

/** Date AAAA-MM-JJ ; `futur` refuse les dates passées (aujourd'hui accepté). */
export const zDate = ({ futur = false, maintenant }: { futur?: boolean; maintenant?: Date } = {}) =>
  z.string({ required_error: REQUIS }).min(1, REQUIS).regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide.')
    .refine(d => !futur || d >= aujourdhui(maintenant), 'La date ne peut pas être passée.')

/** Mot de passe : mêmes règles que le backend (8 caractères au moins). */
export const zMotDePasse = () => z.string({ required_error: REQUIS }).min(8, 'Au moins 8 caractères.').max(128, '128 caractères au maximum.')

/** Même règle que le backend (`NOM_REEL`) : lettres, 2 au moins ; tiret, apostrophe, espace permis. */
export const NOM_REEL = /^(?=(?:[^\p{L}]*\p{L}){2})\p{L}[\p{L}\s'’-]*$/u
export const MESSAGE_NOM = 'Saisissez votre vrai nom : lettres uniquement, 2 minimum (tiret, apostrophe et espace permis).'
export const zNomReel = () => zTexte(100).regex(NOM_REEL, MESSAGE_NOM)
