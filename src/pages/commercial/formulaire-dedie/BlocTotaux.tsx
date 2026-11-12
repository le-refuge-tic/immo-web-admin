import { fcfa, type TotauxGuesthouse, type TotauxSalle } from '../../../shared/biens/calculsTarifs'
import { BLUE } from '../formStyles'

type Ligne = { libelle: string; valeur: string; fort?: boolean; aide?: string }

function Lignes({ titre, lignes }: { titre: string; lignes: Ligne[] }) {
  return (
    <section aria-label={titre} style={{ borderRadius: 14, border: `1.5px solid ${BLUE}55`, background: BLUE + '0D', padding: '14px 16px' }}>
      <h3 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: BLUE }}>{titre}</h3>
      <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 6, columnGap: 12, fontSize: 13 }}>
        {lignes.map(l => (
          <div key={l.libelle} style={{ display: 'contents' }}>
            <dt style={{ color: l.fort ? 'var(--c-text)' : 'var(--c-muted)', fontWeight: l.fort ? 800 : 500, borderTop: l.fort ? '1px solid var(--c-border)' : undefined, paddingTop: l.fort ? 6 : 0 }}>
              {l.libelle}{l.aide && <span style={{ display: 'block', fontSize: 11, fontWeight: 400 }}>{l.aide}</span>}
            </dt>
            <dd style={{ margin: 0, textAlign: 'right', fontWeight: l.fort ? 800 : 600, color: l.fort ? BLUE : 'var(--c-text)', borderTop: l.fort ? '1px solid var(--c-border)' : undefined, paddingTop: l.fort ? 6 : 0, fontVariantNumeric: 'tabular-nums' }}>
              {l.valeur}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

const nonPrecise = (n: number | null) => (n === null ? 'non précisé' : fcfa(n))
const reduction = (pct: number) => (pct > 0 ? `soit ${pct} % de réduction` : pct < 0 ? `soit ${-pct} % plus cher que le tarif à la nuit` : 'sans réduction')

/** Lot 3 — totaux d'une guesthouse (aperçu en direct à l'étape Tarif et au récapitulatif). */
export function TotauxGuesthouseBloc({ t }: { t: TotauxGuesthouse | null }) {
  if (!t) return <p style={{ fontSize: 12, color: 'var(--c-muted)', margin: 0 }}>Saisissez le prix par nuit pour voir les totaux.</p>
  const nuits = `${t.nuiteesMin} nuit${t.nuiteesMin > 1 ? 's' : ''}`
  const lignes: Ligne[] = [
    { libelle: 'Prix par nuit', valeur: fcfa(t.prixNuit) },
    { libelle: `Séjour minimum (${nuits})`, valeur: fcfa(t.sejourMinimum) },
    { libelle: 'Frais de ménage', valeur: nonPrecise(t.fraisMenage) },
    { libelle: 'Caution', valeur: nonPrecise(t.caution) },
    { libelle: `Total à l’arrivée (${nuits})`, valeur: fcfa(t.totalArrivee), fort: true, aide: 'séjour minimum + ménage + caution' },
  ]
  if (t.semaine) lignes.push({ libelle: 'Tarif semaine (7 nuits)', valeur: fcfa(t.semaine.prix), aide: reduction(t.semaine.reductionPct) })
  if (t.mois) lignes.push({ libelle: 'Tarif mois (30 nuits)', valeur: fcfa(t.mois.prix), aide: reduction(t.mois.reductionPct) })
  return <Lignes titre="Totaux" lignes={lignes} />
}

/** Lot 3 — totaux d'une salle de fêtes. */
export function TotauxSalleBloc({ t }: { t: TotauxSalle | null }) {
  if (!t) return <p style={{ fontSize: 12, color: 'var(--c-muted)', margin: 0 }}>Saisissez le prix pour voir les totaux.</p>
  const heures = (n: number) => `${n} h`
  const lignes: Ligne[] = [
    { libelle: `Prix affiché (${heures(t.dureeHeures)})`, valeur: fcfa(t.prix) },
    { libelle: 'Prix à l’heure', valeur: fcfa(t.prixHeure) },
    { libelle: `Durée minimum (${heures(t.heuresMin)})`, valeur: fcfa(t.coutDureeMinimum) },
    { libelle: 'Caution', valeur: nonPrecise(t.caution) },
    { libelle: 'Frais de ménage', valeur: nonPrecise(t.fraisMenage) },
    { libelle: 'Total minimum à verser', valeur: fcfa(t.totalMinimum), fort: true, aide: 'durée minimum + caution + ménage' },
  ]
  if (t.forfaitJournee) lignes.push({ libelle: 'Forfait journée', valeur: fcfa(t.forfaitJournee) })
  if (t.forfaitWeekend) lignes.push({ libelle: 'Forfait week-end', valeur: fcfa(t.forfaitWeekend) })
  return <Lignes titre="Totaux" lignes={lignes} />
}
