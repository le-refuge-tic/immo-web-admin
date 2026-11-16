import { aEnvoyer, planifierSynchro, type EntreeBrouillon, type EtatSynchro, type ResumeServeur } from './planSynchro'

/** Un stockage local de brouillons (un formulaire), adapté au format de chaque front. */
export interface MagasinBrouillons {
  /** Familles que ce magasin sait écrire (« guesthouse », « bien »…). */
  familles: readonly string[]
  lire: () => EntreeBrouillon[]
  ecrire: (e: EntreeBrouillon) => void
  retirer: (cle: string) => void
  /** Vide le magasin (un autre compte se connecte sur ce navigateur). */
  vider: () => void
}

/** Routes /brouillons-biens, déjà liées à l'espace du front. */
export interface ApiBrouillons {
  lister: () => Promise<ResumeServeur[]>
  lire: (cle: string) => Promise<ResumeServeur & { donnees: Record<string, unknown> }>
  enregistrer: (e: EntreeBrouillon) => Promise<{ maj_le: number; applique: boolean }>
  /** Ne supprime que si la version du serveur n'est pas plus récente que `majLeMax`. */
  supprimer: (cle: string, majLeMax: number) => Promise<void>
}

export interface EtatEnregistre {
  compte: number
  etat: EtatSynchro
}

export interface StockageEtat {
  lire: () => EtatEnregistre | null
  ecrire: (v: EtatEnregistre) => void
}

export interface ResultatSynchro {
  /** Des brouillons de cet appareil ont été ajoutés, remplacés ou retirés. */
  modifiesIci: boolean
  echecs: number
}

/**
 * Rattache les brouillons de l'appareil au compte connecté : ceux d'un autre compte sont retirés
 * (ils sont sur le serveur, à lui). À appeler dès la connexion, avant d'afficher une liste.
 * Renvoie l'état de synchronisation du compte.
 */
export function preparerCompte(compte: number, magasins: readonly MagasinBrouillons[], stockage: StockageEtat): { etat: EtatSynchro; vide: boolean } {
  const enregistre = stockage.lire()
  const autreCompte = !!enregistre && enregistre.compte !== compte
  if (autreCompte) magasins.forEach(m => m.vider())
  const etat: EtatSynchro = enregistre?.compte === compte ? { ...enregistre.etat } : {}
  stockage.ecrire({ compte, etat })
  return { etat, vide: autreCompte }
}

const famillesDe = (magasins: readonly MagasinBrouillons[], famille: string) => magasins.find(m => m.familles.includes(famille))

/**
 * Une passe de synchronisation. `complete` relit la liste du serveur (ouverture, retour sur la
 * page, retour du réseau) ; sinon seules les saisies récentes sont envoyées. Chaque opération
 * est indépendante : un échec n'empêche pas les autres, il sera repris à la passe suivante.
 */
export async function synchroniser({ compte, api, magasins, stockage, complete }: {
  compte: number
  api: ApiBrouillons
  magasins: readonly MagasinBrouillons[]
  stockage: StockageEtat
  complete: boolean
}): Promise<ResultatSynchro> {
  // Brouillons d'un autre compte sur ce navigateur : ils sont à lui (et sur le serveur), pas à nous.
  const { etat, vide } = preparerCompte(compte, magasins, stockage)
  let modifiesIci = vide
  let echecs = 0
  const sauver = () => stockage.ecrire({ compte, etat })

  const ici = magasins.flatMap(m => m.lire())
  const plan = complete
    ? planifierSynchro(ici, await api.lister(), etat)
    : { envoyer: aEnvoyer(ici, etat), recuperer: [], retirerIci: [], supprimerServeur: [] }

  const tenter = async (operation: () => Promise<void>) => {
    try { await operation() } catch { echecs += 1 } finally { sauver() }
  }
  /** Relu juste avant d'écrire : une saisie faite pendant la passe n'est jamais écrasée. */
  const majLeIci = (magasin: MagasinBrouillons, cle: string) => magasin.lire().find(e => e.cle === cle)?.majLe
  const recuperer = async (cle: string) => {
    const b = await api.lire(cle)
    const magasin = famillesDe(magasins, b.famille)
    if (!magasin) return
    const actuel = majLeIci(magasin, cle)
    if (actuel !== undefined && actuel > b.maj_le) return
    magasin.ecrire({ cle: b.cle, famille: b.famille, libelle: b.libelle, etape: b.etape, majLe: b.maj_le, donnees: b.donnees })
    etat[cle] = b.maj_le
    modifiesIci = true
  }

  for (const e of plan.envoyer) {
    await tenter(async () => {
      const r = await api.enregistrer(e)
      etat[e.cle] = r.maj_le
      // Version plus récente sur le serveur (autre appareil) : c'est elle qui est gardée.
      if (!r.applique) await recuperer(e.cle)
    })
  }
  for (const s of plan.recuperer) await tenter(() => recuperer(s.cle))
  for (const e of plan.retirerIci) {
    await tenter(async () => {
      const magasin = famillesDe(magasins, e.famille)
      const actuel = magasin ? majLeIci(magasin, e.cle) : undefined
      if (actuel !== undefined && actuel > e.majLe) return // modifié pendant la passe : envoyé à la suivante
      magasin?.retirer(e.cle)
      delete etat[e.cle]
      modifiesIci = true
    })
  }
  for (const { cle, majLe } of plan.supprimerServeur) {
    await tenter(async () => {
      await api.supprimer(cle, majLe)
      delete etat[cle]
    })
  }
  return { modifiesIci, echecs }
}
