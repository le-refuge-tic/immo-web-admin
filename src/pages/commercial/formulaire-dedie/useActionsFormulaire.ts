import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConfirm } from '../../../shared/dialogues/useConfirm'
import { configurationFraisVisite } from '../../../api/configurationFraisVisite'
import { FRAIS_VISITE_DEFAUT } from '../guesthouse/guesthouseForm'

/**
 * Lot 3 — « Annuler » (garder / supprimer le brouillon / continuer) et « Changer de type »
 * passent par une boîte de dialogue ; frais de visite lus dans la configuration.
 */
export function useActionsFormulaire({ brouillonId, supprimerBrouillon }: {
  brouillonId: string | null
  supprimerBrouillon: (id: string) => void
}) {
  const navigate = useNavigate()
  const { choisir, confirmer } = useConfirm()
  const [fraisVisite, setFraisVisite] = useState(FRAIS_VISITE_DEFAUT)

  useEffect(() => {
    let actif = true
    configurationFraisVisite.public()
      .then(r => {
        const m = Number(r?.montant)
        if (actif && Number.isFinite(m) && m >= 0) setFraisVisite(m)
      })
      .catch(() => { /* repli : tarif par défaut, comme l'API */ })
    return () => { actif = false }
  }, [])

  const annuler = async () => {
    if (!brouillonId) { navigate('/mes-annonces'); return }
    const choix = await choisir<'garder' | 'supprimer' | 'continuer'>({
      titre: 'Quitter le formulaire ?',
      message: 'Votre brouillon sera conservé : vous le retrouverez dans « Mes annonces ».',
      actions: [
        { valeur: 'continuer', libelle: 'Continuer la saisie', ton: 'neutre' },
        { valeur: 'supprimer', libelle: 'Supprimer le brouillon', ton: 'danger' },
        { valeur: 'garder', libelle: 'Garder le brouillon', ton: 'primaire' },
      ],
    })
    if (choix === 'supprimer') supprimerBrouillon(brouillonId)
    if (choix === 'garder' || choix === 'supprimer') navigate('/mes-annonces')
  }

  const changerDeType = async () => {
    const ok = await confirmer({
      titre: 'Changer de type de bien ?',
      message: brouillonId
        ? 'Vous revenez au choix du type. Votre saisie reste dans vos brouillons.'
        : 'Vous revenez au choix du type.',
      confirmer: 'Changer de type',
    })
    if (ok) navigate('/publier-bien')
  }

  return { annuler, changerDeType, fraisVisite }
}
