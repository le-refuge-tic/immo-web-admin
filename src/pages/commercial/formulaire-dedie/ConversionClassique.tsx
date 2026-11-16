import { useState } from 'react'
import SelecteurTypeBien from '../../../components/SelecteurTypeBien'
import { patchAdminBien } from '../../../api/patchAdminBien'
import { useToast } from '../../../context/ToastContext'
import { useConfirm } from '../../../shared/dialogues/useConfirm'
import { donneesPerduesConversion, sousTypeParCle } from '../../../shared/biens/referentielTypes'
import { apiMessage } from '../../../utils/apiMessage'
import { MoneyInput } from '../formUi'
import { Libelle } from '../guesthouse/ui'

/**
 * Lot 5 — « Convertir en bien classique » (admin) depuis une guesthouse ou une salle de fêtes :
 * type cible, transaction et prix, puis confirmation listant ce qui sera supprimé.
 */
export default function ConversionClassique({ bien, onConverti }: {
  bien: { id: number; type: string; amenites?: Record<string, unknown> | null; equipements_liste?: unknown[]; evenements?: unknown[] }
  onConverti: () => void
}) {
  const toast = useToast()
  const { confirmer } = useConfirm()
  const [ouvert, setOuvert] = useState(false)
  const [cle, setCle] = useState('villa')
  const [meuble, setMeuble] = useState(false)
  const [transaction, setTransaction] = useState<'location' | 'vente'>('location')
  const [prix, setPrix] = useState('')
  const [enCours, setEnCours] = useState(false)
  const st = sousTypeParCle(cle)
  const prixNombre = Number(prix.replace(/\s/g, ''))
  const valide = !!st && Number.isInteger(prixNombre) && prixNombre > 0 && st.transactions.includes(transaction)

  const convertir = async () => {
    if (!valide || !st) return
    const pertes = donneesPerduesConversion(bien, { cle, meuble })
    const ok = await confirmer({
      titre: `Convertir en « ${st.libelle} » ?`,
      message: <>Seront définitivement supprimés : <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{pertes.map(x => <li key={x}>{x}</li>)}</ul></>,
      confirmer: 'Convertir',
      danger: true,
    })
    if (!ok) return
    setEnCours(true)
    try {
      await patchAdminBien.convertir(bien.id, { cle, meuble: !!st.meuble && meuble, transaction, prix: prixNombre })
      toast(`Bien converti en « ${st.libelle} ». Complétez sa fiche.`, 'success')
      onConverti()
    } catch (err) {
      toast(apiMessage(err) ?? 'La conversion a échoué.', 'error')
    } finally {
      setEnCours(false)
    }
  }

  if (!ouvert) {
    return (
      <button type="button" className="btn-cancel" onClick={() => setOuvert(true)}>Convertir en bien classique</button>
    )
  }
  return (
    <section aria-label="Convertir en bien classique" style={{ border: '1px solid var(--c-border)', borderRadius: 12, padding: 16, background: 'var(--c-card)', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SelecteurTypeBien valeur={cle} onChange={setCle} formulaires={['classique']} />
      {st?.meuble && (
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
          <input type="checkbox" checked={meuble} onChange={e => setMeuble(e.target.checked)} /> Meublé
        </label>
      )}
      <div>
        <Libelle>Transaction</Libelle>
        <select value={transaction} onChange={e => setTransaction(e.target.value as 'location' | 'vente')} aria-label="Transaction"
          style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--c-border)', background: 'var(--c-card)', color: 'var(--c-text)' }}>
          {(st?.transactions ?? ['location']).map(t => <option key={t} value={t}>{t === 'location' ? 'Location' : 'Vente'}</option>)}
        </select>
      </div>
      <div>
        <Libelle>{transaction === 'vente' ? 'Prix de vente' : 'Loyer mensuel'}</Libelle>
        <MoneyInput value={prix} onChange={setPrix} placeholder="150000" />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" className="btn-cancel" onClick={() => setOuvert(false)}>Annuler</button>
        <button type="button" className="btn-submit" disabled={!valide || enCours} onClick={() => void convertir()}
          style={{ flex: 1, opacity: !valide || enCours ? 0.5 : 1 }}>
          {enCours ? 'Conversion…' : 'Convertir'}
        </button>
      </div>
    </section>
  )
}
