import { Card, Section } from '../formUi'
import { baseInput, BLUE } from '../formStyles'
import type { ChampsIdentite, TextesIdentite } from './guesthouseForm'
import { Libelle, Texte } from './ui'

const TEXTES_GUESTHOUSE: TextesIdentite = {
  titre: 'La guesthouse',
  libelleNom: 'Nom de la guesthouse',
  placeholderNom: 'Ex. Villa Les Palmiers',
  placeholderDescription: 'Ambiance, points forts, proximité (plage, marché, aéroport…)',
}

type Props = {
  form: ChampsIdentite
  maj: (patch: Partial<ChampsIdentite>) => void
  textes?: TextesIdentite
}

export default function EtapeIdentite({ form, maj, textes = TEXTES_GUESTHOUSE }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <Section title={textes.titre} required />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <Libelle>{textes.libelleNom}</Libelle>
            <Texte value={form.nom} onChange={v => maj({ nom: v })} maxLength={100}
              placeholder={textes.placeholderNom} />
          </div>
          <div>
            <Libelle>Description</Libelle>
            <textarea value={form.description} onChange={e => maj({ description: e.target.value })}
              rows={5} maxLength={1800}
              placeholder={textes.placeholderDescription}
              style={{ ...baseInput, resize: 'vertical', fontFamily: 'inherit' }}
              onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} />
          </div>
        </div>
      </Card>

      <Card>
        <Section title="Propriétaire ou gestionnaire" required />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <div>
            <Libelle facultatif>Prénom</Libelle>
            <Texte value={form.proprioPrenom} onChange={v => maj({ proprioPrenom: v })} maxLength={100} />
          </div>
          <div>
            <Libelle>Nom</Libelle>
            <Texte value={form.proprioNom} onChange={v => maj({ proprioNom: v })} maxLength={100} />
          </div>
          <div>
            <Libelle>Téléphone</Libelle>
            <Texte type="tel" value={form.proprioTelephone} onChange={v => maj({ proprioTelephone: v })}
              placeholder="+229 01 97 00 00 00" maxLength={20} />
          </div>
          <div>
            <Libelle facultatif>E-mail</Libelle>
            <Texte type="email" value={form.proprioEmail} onChange={v => maj({ proprioEmail: v })} maxLength={150} />
          </div>
        </div>
      </Card>
    </div>
  )
}
