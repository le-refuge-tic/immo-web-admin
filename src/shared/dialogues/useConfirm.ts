/**
 * Contexte et types des boîtes de confirmation (voir ConfirmProvider).
 * Fichier identique dans immo-web-admin et immo-web-user (src/shared/dialogues).
 */
import { createContext, useContext, type ReactNode, type RefObject } from 'react'

export type TonAction = 'danger' | 'primaire' | 'neutre'

export interface ActionDialogue<T> {
  valeur: T
  libelle: string
  ton?: TonAction
}

export interface DemandeChoix<T> {
  titre: string
  message?: ReactNode
  actions: ActionDialogue<T>[]
}

export interface DemandeConfirmation {
  titre: string
  message?: ReactNode
  /** Libellé du bouton principal (défaut : « Confirmer »). */
  confirmer?: string
  annuler?: string
  /** Action destructive : bouton principal rouge. */
  danger?: boolean
}

export interface ProprietesRendu {
  titre: string
  message?: ReactNode
  actions: ActionDialogue<unknown>[]
  /** Clic sur une action ; `null` = fermeture (Échap, clic à côté, Annuler). */
  repondre: (valeur: unknown) => void
  idTitre: string
  idMessage: string
  refDialogue: RefObject<HTMLDivElement | null>
}

export interface ValeurConfirm {
  confirmer: (d: DemandeConfirmation) => Promise<boolean>
  choisir: <T>(d: DemandeChoix<T>) => Promise<T | null>
}

export const ContexteConfirm = createContext<ValeurConfirm | null>(null)

export function useConfirm(): ValeurConfirm {
  const ctx = useContext(ContexteConfirm)
  if (!ctx) throw new Error('useConfirm doit être utilisé dans ConfirmProvider')
  return ctx
}
