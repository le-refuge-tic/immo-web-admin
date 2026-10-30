import { Card, Section, RecapSection } from '../formUi'
import SelecteurMedias from '../guesthouse/SelecteurMedias'
import {
  LIBELLES_CONFIGURATION,
  LIBELLES_TRAITEUR,
  apercuPrix,
  entierFcfa,
  formatFcfa,
  libelleHoraires,
  type SalleFeteForm,
} from './salleFeteForm'

type Props = {
  form: SalleFeteForm
  photos: File[]
  setPhotos: (p: File[]) => void
  video: File | null
  setVideo: (v: File | null) => void
  libellesEquipements: Record<string, string>
  libellesEvenements: Record<string, string>
  signaler: (message: string) => void
}

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`

export default function EtapePhotos({
  form, photos, setPhotos, video, setVideo, libellesEquipements, libellesEvenements, signaler,
}: Props) {
  const apercu = apercuPrix(form.prix, form.dureeHeures)
  const caution = form.caution.trim() ? entierFcfa(form.caution, true) : undefined
  const menage = form.fraisMenage.trim() ? entierFcfa(form.fraisMenage, true) : undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SelecteurMedias photos={photos} setPhotos={setPhotos} video={video} setVideo={setVideo} signaler={signaler}
        conseilPhotos="Salle vide, salle aménagée, scène, extérieur, parking, sanitaires." />

      <Card>
        <Section title="Récapitulatif" />
        <RecapSection title="Salle de fêtes" items={[form.nom, form.description].filter(Boolean)} />
        <RecapSection title="Propriétaire" items={[
          [form.proprioPrenom, form.proprioNom].filter(Boolean).join(' '),
          form.proprioTelephone, form.proprioEmail,
        ].filter(Boolean)} />
        <RecapSection title="Localisation" items={[
          [form.quartier, form.arrondissement, form.ville].filter(Boolean).join(', '),
          form.repere,
        ].filter(Boolean)} />
        <RecapSection title="Tarif et capacité" items={[
          apercu ? `${apercu.affiche}${apercu.parHeure ? ` (${apercu.parHeure})` : ''}` : '',
          `Durée minimum : ${pluriel(form.heuresMin, 'heure')}`,
          caution !== undefined ? `Caution : ${formatFcfa(caution)}` : '',
          menage !== undefined ? `Frais de ménage : ${formatFcfa(menage)}` : '',
          `${pluriel(Number(form.capacite) || 0, 'personne')}${form.superficie.trim() ? ` · ${form.superficie.trim()} m²` : ''}`,
          form.configuration ? `Configuration : ${LIBELLES_CONFIGURATION[form.configuration].toLowerCase()}` : '',
          [form.nbTables.trim() && `${form.nbTables.trim()} tables`, form.nbChaises.trim() && `${form.nbChaises.trim()} chaises`]
            .filter(Boolean).join(' · '),
        ].filter(Boolean)} />
        <RecapSection title="Événements acceptés" items={form.evenements.map(c => libellesEvenements[c] ?? c)} />
        <RecapSection title="Équipements" items={form.equipements.map(c => libellesEquipements[c] ?? c)} />
        <RecapSection title="Parking, horaires et règles" items={[
          form.parking ? `Parking : ${pluriel(Number(form.placesParking) || 0, 'place')}` : 'Pas de parking',
          `Horaires : ${libelleHoraires(form.heureOuverture, form.heureFinMax)}`,
          form.heureFinMusique ? `Musique jusqu’à ${form.heureFinMusique}` : '',
          form.traiteur ? LIBELLES_TRAITEUR[form.traiteur][0].toUpperCase() + LIBELLES_TRAITEUR[form.traiteur].slice(1) : '',
          `Décoration ${form.deco ? 'autorisée' : 'interdite'} · alcool ${form.alcool ? 'autorisé' : 'interdit'}`,
          form.insonorisee === null ? '' : (form.insonorisee ? 'Salle insonorisée' : 'Salle non insonorisée'),
        ].filter(Boolean)} />
      </Card>
    </div>
  )
}
