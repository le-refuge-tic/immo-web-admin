/**
 * Contexte, types et messages du gestionnaire d'envois (voir GestionEnvoisProvider).
 * Fichier identique dans immo-web-admin et immo-web-user (src/shared/uploads).
 */
import { createContext, useContext } from 'react'
import { avancement, type LotEnvoi } from './fileEnvoi'

export type TonNotification = 'success' | 'error' | 'info'
export type Notifier = (message: string, ton: TonNotification) => void

export interface DemandeEnvoi {
  bienId: number
  libelle: string
  /** Page « compléter les photos » proposée en cas d'échec. */
  lien?: string
  photos: readonly Blob[]
  video?: Blob | null
}

export interface GestionEnvoisValeur {
  /** Envois en cours ou terminés avec des échecs (à reprendre). */
  lots: LotEnvoi[]
  /** Envois interrompus par un rechargement, en attente de « Reprendre l'envoi ». */
  interrompus: LotEnvoi[]
  demarrer: (demande: DemandeEnvoi) => void
  reprendre: (lotId: string) => void
  abandonner: (lotId: string) => void
}

export const ContexteEnvois = createContext<GestionEnvoisValeur | null>(null)

export const MESSAGE_DEPART = 'Votre annonce est enregistrée. Les photos s’envoient en arrière-plan : ne fermez pas l’onglet.'
export const messageFin = (libelle: string) => `Toutes les photos de ${libelle} sont en ligne. L’annonce part en validation.`
export function messageEchec(lot: LotEnvoi): string {
  const { echecs } = avancement(lot)
  return `${echecs} fichier${echecs > 1 ? 's' : ''} de ${lot.libelle} n’${echecs > 1 ? 'ont' : 'a'} pas pu être envoyé${echecs > 1 ? 's' : ''}. Réessayez ou complétez les photos.`
}

export function useGestionEnvois(): GestionEnvoisValeur {
  const ctx = useContext(ContexteEnvois)
  if (!ctx) throw new Error('useGestionEnvois doit être utilisé dans GestionEnvoisProvider')
  return ctx
}
