/**
 * Lot 1 — envois de médias gardés dans IndexedDB tant qu'ils ne sont pas
 * terminés : un rechargement de l'onglet ne perd ni les fichiers ni l'état.
 * Fichier identique dans immo-web-admin et immo-web-user (src/shared/uploads).
 *
 * Les fichiers sont écrits une seule fois (magasin « fichiers ») ; seuls les
 * états changent ensuite (magasin « lots », sans fichiers). Toutes les
 * écritures passent par une même file : une suppression ne peut pas être
 * doublée par une écriture plus ancienne.
 * Tout échec d'IndexedDB (navigation privée, quota) désactive la reprise sans
 * bloquer l'envoi en cours.
 */
import type { ElementEnvoi, LotEnvoi } from './fileEnvoi'

const DB_NAME = 'refuge_envois_medias'
const LOTS = 'lots'
const FICHIERS = 'fichiers'
const DB_VERSION = 1

type ElementStocke = Omit<ElementEnvoi, 'fichier'>
type LotStocke = Omit<LotEnvoi, 'elements'> & { elements: ElementStocke[] }

function ouvrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(LOTS, { keyPath: 'id' })
      req.result.createObjectStore(FICHIERS)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    req.onblocked = () => reject(new Error('IndexedDB bloquée'))
  })
}

/** Exécute `action` dans une transaction sur les deux magasins, puis ferme la base. */
async function transaction<T>(mode: IDBTransactionMode, action: (lots: IDBObjectStore, fichiers: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await ouvrir()
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction([LOTS, FICHIERS], mode)
      const req = action(tx.objectStore(LOTS), tx.objectStore(FICHIERS))
      tx.oncomplete = () => resolve(req ? req.result : undefined)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

let file: Promise<unknown> = Promise.resolve()
/** Écritures sérialisées : l'ordre des appels est l'ordre d'application. */
function enFile(ecriture: () => Promise<unknown>): Promise<void> {
  const suite = file.then(ecriture).catch(() => { /* reprise indisponible */ })
  file = suite
  return suite.then(() => undefined)
}

const sansFichiers = (lot: LotEnvoi): LotStocke => ({
  ...lot,
  elements: lot.elements.map(e => ({ id: e.id, genre: e.genre, nom: e.nom, statut: e.statut, essais: e.essais, erreur: e.erreur })),
})

/** Premier enregistrement d'un lot : fichiers et état. */
export function enregistrerNouveauLot(lot: LotEnvoi): Promise<void> {
  return enFile(() => transaction('readwrite', (lots, fichiers) => {
    for (const e of lot.elements) fichiers.put(e.fichier, e.id)
    lots.put(sansFichiers(lot))
  }))
}

/** Mise à jour de l'état seul (les fichiers sont déjà enregistrés). */
export function enregistrerEtat(lot: LotEnvoi): Promise<void> {
  return enFile(() => transaction('readwrite', lots => { lots.put(sansFichiers(lot)) }))
}

export function supprimerLot(lot: LotEnvoi): Promise<void> {
  return enFile(() => transaction('readwrite', (lots, fichiers) => {
    for (const e of lot.elements) fichiers.delete(e.id)
    lots.delete(lot.id)
  }))
}

function estLotStocke(v: unknown): v is LotStocke {
  const l = v as Partial<LotStocke> | undefined
  return !!l && typeof l.id === 'string' && typeof l.bienId === 'number' && Array.isArray(l.elements)
}

/** Envois restés inachevés (onglet fermé ou rechargé) de l'utilisateur `utilisateurId`. */
export async function lireLots(utilisateurId: number): Promise<LotEnvoi[]> {
  try {
    await file
    const stockes = ((await transaction<unknown[]>('readonly', lots => lots.getAll())) ?? []).filter(estLotStocke)
    const resultat: LotEnvoi[] = []
    for (const l of stockes.filter(x => x.utilisateurId === utilisateurId)) {
      const elements: ElementEnvoi[] = []
      for (const e of l.elements) {
        const fichier = await transaction<unknown>('readonly', (_lots, fichiers) => fichiers.get(e.id))
        if (!(fichier instanceof Blob)) break
        elements.push({ ...e, fichier })
      }
      if (elements.length === l.elements.length) resultat.push({ ...l, elements })
    }
    return resultat.sort((a, b) => a.creeLe - b.creeLe)
  } catch {
    return []
  }
}

/** Déconnexion : les fichiers d'un compte ne doivent pas rester sur l'appareil. */
export function viderLots(): Promise<void> {
  return enFile(() => transaction('readwrite', (lots, fichiers) => { lots.clear(); fichiers.clear() }))
}
