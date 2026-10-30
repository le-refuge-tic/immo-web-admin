import { Card, Section, RecapSection } from '../formUi'
import { entierFcfa, formatFcfa, TYPES_LIT, type GuesthouseForm } from './guesthouseForm'
import SelecteurMedias from './SelecteurMedias'

type Props = {
  form: GuesthouseForm
  photos: File[]
  setPhotos: (p: File[]) => void
  video: File | null
  setVideo: (v: File | null) => void
  libellesEquipements: Record<string, string>
  signaler: (message: string) => void
}

export default function EtapePhotos({ form, photos, setPhotos, video, setVideo, libellesEquipements, signaler }: Props) {
  const prix = entierFcfa(form.prixNuitee)
  const caution = entierFcfa(form.caution, true)
  const lits = form.lits.map(l => `${l.nombre} × ${TYPES_LIT.find(t => t.value === l.type)?.label ?? l.type}`).join(', ')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SelecteurMedias photos={photos} setPhotos={setPhotos} video={video} setVideo={setVideo} signaler={signaler}
        conseilPhotos="Façade, chambres, salon, cuisine, salle de bain, garage." />

      <Card>
        <Section title="Récapitulatif" />
        <RecapSection title="Guesthouse" items={[form.nom, form.description].filter(Boolean)} />
        <RecapSection title="Propriétaire" items={[
          [form.proprioPrenom, form.proprioNom].filter(Boolean).join(' '),
          form.proprioTelephone, form.proprioEmail,
        ].filter(Boolean)} />
        <RecapSection title="Localisation" items={[
          [form.quartier, form.arrondissement, form.ville].filter(Boolean).join(', '),
          form.repere,
        ].filter(Boolean)} />
        <RecapSection title="Tarif et capacité" items={[
          prix !== undefined ? `${formatFcfa(prix)} / nuit` : '',
          caution !== undefined && form.caution.trim() ? `Caution : ${formatFcfa(caution)}` : '',
          `Séjour minimum : ${form.nuiteesMin} nuit${form.nuiteesMin > 1 ? 's' : ''}`,
          `${form.capacite} voyageur${form.capacite > 1 ? 's' : ''} · ${form.nbChambres} chambre${form.nbChambres > 1 ? 's' : ''} · ${form.nbSallesBain} salle${form.nbSallesBain > 1 ? 's' : ''} de bain`,
          lits,
        ].filter(Boolean)} />
        <RecapSection title="Équipements" items={form.equipements.map(c => libellesEquipements[c] ?? c)} />
        <RecapSection title="Garage et règles" items={[
          form.garage ? `Garage : oui (accès ${form.typeAccesGarage === 'prive' ? 'privé' : 'commun'})` : 'Garage : non',
          `Arrivée ${form.heureArrivee} · départ ${form.heureDepart}`,
          `Animaux ${form.animaux ? 'autorisés' : 'interdits'} · fêtes ${form.fetes ? 'autorisées' : 'interdites'} · fumeur ${form.fumeur ? 'autorisé' : 'interdit'}`,
        ]} />
      </Card>
    </div>
  )
}
