/**
 * Lot 1 — envois de médias gardés dans IndexedDB tant qu'ils ne sont pas
 * terminés : un rechargement de l'onglet ne perd ni les fichiers ni l'état.
 * Fichier identique dans immo-web-admin et immo-web-user (src/shared/uploads).
 * Tout échec d'IndexedDB (navigation privée, quota) désactive la reprise sans
 * bloquer l'envoi en cours.
 */
import type { LotEnvoi } from './fileEnvoi'

const DB_NAME = 'refuge_envois_medias'
const STORE = 'lots'
const DB_VERSION = 1

function ouvrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => { req.result.createObjectStore(STORE, { keyPath: 'id' }) }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    req.onblocked = () => reject(new Error('IndexedDB bloquée'))
  })
}

async function executer<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await ouvrir()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      const req = action(tx.objectStore(STORE))
      tx.oncomplete = () => resolve(req.result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

function estLot(v: unknown): v is LotEnvoi {
  const l = v as Partial<LotEnvoi> | undefined
  return !!l && typeof l.id === 'string' && typeof l.bienId === 'number' && Array.isArray(l.elements)
    && l.elements.every(e => e && e.fichier instanceof Blob)
}

export async function enregistrerLot(lot: LotEnvoi): Promise<void> {
  try { await executer('readwrite', s => s.put(lot)) } catch { /* reprise indisponible */ }
}

export async function supprimerLot(id: string): Promise<void> {
  try { await executer('readwrite', s => s.delete(id)) } catch { /* rien à nettoyer */ }
}

/** Envois restés inachevés (onglet fermé ou rechargé). */
export async function lireLots(): Promise<LotEnvoi[]> {
  try {
    const tous = await executer<unknown[]>('readonly', s => s.getAll())
    return tous.filter(estLot).sort((a, b) => a.creeLe - b.creeLe)
  } catch {
    return []
  }
}

/** Déconnexion : les fichiers d'un compte ne doivent pas rester sur l'appareil. */
export async function viderLots(): Promise<void> {
  try { await executer('readwrite', s => s.clear()) } catch { /* rien à nettoyer */ }
}
