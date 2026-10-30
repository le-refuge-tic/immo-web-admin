import { Card, Section, Chip } from '../formUi'
import { baseInput } from '../formStyles'
import type { GroupeEquipements } from '../../../api/guesthouse'
import type { TypeEvenement } from '../../../api/salleFete'
import ChoixEquipements from '../guesthouse/ChoixEquipements'
import { Libelle, OuiNon } from '../guesthouse/ui'
import { TRAITEURS, finLendemain } from './salleFeteForm'
import { ChoixUnique, NombreEntier, type EtapeProps } from './ui'

type Props = EtapeProps & {
  evenements: TypeEvenement[] | null
  erreurEvenements: string
  groupes: GroupeEquipements[] | null
  erreurEquipements: string
  /** Relance le chargement des référentiels (événements et équipements) */
  reessayer: () => void
}

const basculer = (liste: string[], code: string) =>
  liste.includes(code) ? liste.filter(c => c !== code) : [...liste, code]

export default function EtapeRegles({ form, maj, evenements, erreurEvenements, groupes, erreurEquipements, reessayer }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <Section title="Événements acceptés" required />
        {erreurEvenements ? (
          <div role="alert" style={{ fontSize: 13, color: 'var(--s-red)' }}>
            {erreurEvenements}{' '}
            <button type="button" onClick={reessayer}
              style={{ border: 'none', background: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700 }}>
              Réessayer
            </button>
          </div>
        ) : !evenements ? (
          <p style={{ fontSize: 13, color: 'var(--c-muted)' }}>Chargement des types d’événements…</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {evenements.map(e => (
              <Chip key={e.code} label={e.libelle} active={form.evenements.includes(e.code)}
                onClick={() => maj({ evenements: basculer(form.evenements, e.code) })} />
            ))}
          </div>
        )}
      </Card>

      <Card>
        <Section title="Équipements et services" />
        <ChoixEquipements groupes={groupes} erreur={erreurEquipements} reessayer={reessayer}
          selection={form.equipements} basculer={code => maj({ equipements: basculer(form.equipements, code) })} />
      </Card>

      <Card>
        <Section title="Parking" required />
        <OuiNon value={form.parking}
          onChange={v => maj({ parking: v, placesParking: v ? form.placesParking : '' })} />
        {form.parking && (
          <div style={{ marginTop: 14 }}>
            <Libelle>Nombre de places</Libelle>
            <NombreEntier value={form.placesParking} onChange={v => maj({ placesParking: v })} unite="places"
              placeholder="40" ariaLabel="Nombre de places de parking" />
          </div>
        )}
      </Card>

      <Card>
        <Section title="Horaires" required />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          <div>
            <Libelle>Ouverture</Libelle>
            <input type="time" value={form.heureOuverture} onChange={e => maj({ heureOuverture: e.target.value })}
              aria-label="Heure d’ouverture" style={baseInput} />
          </div>
          <div>
            <Libelle>Fin au plus tard</Libelle>
            <input type="time" value={form.heureFinMax} onChange={e => maj({ heureFinMax: e.target.value })}
              aria-label="Heure limite de fin" style={baseInput} />
          </div>
        </div>
        <p style={{ fontSize: 12, margin: '10px 0 0', color: 'var(--c-muted)' }}>
          {finLendemain(form.heureOuverture, form.heureFinMax)
            ? `La salle ferme à ${form.heureFinMax}, le lendemain.`
            : 'Une fin après minuit est possible (ouverture 18:00, fin 02:00 : jusqu’à 2 h du matin).'}
        </p>
        <div style={{ marginTop: 14 }}>
          <Libelle facultatif>Musique à arrêter à</Libelle>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="time" value={form.heureFinMusique} onChange={e => maj({ heureFinMusique: e.target.value })}
              aria-label="Heure de fin de la musique" style={{ ...baseInput, width: 'auto', flex: '1 1 150px' }} />
            {form.heureFinMusique && (
              <button type="button" onClick={() => maj({ heureFinMusique: '' })}
                style={{ border: 'none', background: 'none', color: 'var(--s-red)', cursor: 'pointer', fontWeight: 700 }}>
                Retirer
              </button>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <Section title="Règles de la salle" required />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <Libelle>Traiteur</Libelle>
            <ChoixUnique ariaLabel="Traiteur" options={TRAITEURS} value={form.traiteur}
              onChange={v => maj({ traiteur: v })} />
          </div>
          <div>
            <Libelle>Décoration</Libelle>
            <OuiNon value={form.deco} oui="Autorisée" non="Interdite" onChange={v => maj({ deco: v })} />
          </div>
          <div>
            <Libelle>Alcool</Libelle>
            <OuiNon value={form.alcool} oui="Autorisé" non="Interdit" onChange={v => maj({ alcool: v })} />
          </div>
          <div>
            <Libelle>Insonorisation</Libelle>
            <OuiNon value={form.insonorisee} oui="Insonorisée" non="Non insonorisée"
              onChange={v => maj({ insonorisee: v })} />
          </div>
        </div>
      </Card>
    </div>
  )
}
