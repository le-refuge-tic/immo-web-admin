import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { postBien } from '../../api/postBien';

/* ─── Référentiels ───────────────────────────────────────── */

const TYPES_BIEN = [
  { display: 'Chambre-Salon',      type: 'appart_vide', sousType: 'chambre_salon',       desc: 'Chambre + salon séparé' },
  { display: 'Entrée-Coucher',     type: 'appart_vide', sousType: 'entree_coucher',      desc: 'Entrée indépendante + chambre' },
  { display: 'Appartement',        type: 'appart_vide', sousType: 'appartement',         desc: 'Studio, F2, F3…' },
  { display: 'Villa',              type: 'maison',       sousType: 'villa',               desc: 'Résidence avec jardin ou piscine' },
  { display: 'Maison',             type: 'maison',       sousType: 'maison_individuelle', desc: 'Maison complète indépendante' },
  { display: 'Boutique / Local',   type: 'maison',       sousType: 'boutique',            desc: 'Commerce, bureau, local' },
  { display: 'Terrain / Parcelle', type: 'terrain',      sousType: 'terrain',             desc: 'Parcelle nue, lotissement' },
];

const PEUT_ETRE_MEUBLE = ['Appartement', 'Villa', 'Maison'];

const SANITAIRE_OPTS = [
  { value: 'interieur', label: 'Sanitaire intérieur', sub: 'Douche dans le logement' },
  { value: 'cour',      label: 'Non sanitaire',       sub: 'Douche extérieure ou commune' },
  { value: 'autre',     label: 'Autre',               sub: 'À préciser' },
];

const FINITION_OPTS = [
  { value: 'ordinaire',     label: 'Ordinaire',     sub: 'Finition de base, fonctionnel' },
  { value: 'semi_staffe',   label: 'Semi-Staffé',   sub: 'Salon staffé et carrelé' },
  { value: 'staffe_carele', label: 'Staffé',        sub: 'Staff complet, carreaux modernes' },
  { value: 'haut_standing', label: 'Haut Standing', sub: 'Baies vitrées, douche moderne, clim' },
];

const CUISINE_OPTS = [
  { value: 'separee_douche', label: 'Cuisine séparée de la douche', sub: '' },
  { value: 'americaine',     label: 'Cuisine américaine',           sub: 'Ouverte sur le salon' },
  { value: 'autre',          label: 'Autre',                        sub: '' },
];

const DOC_TERRAIN_OPTS = [
  { value: 'permis_construire',      label: 'Permis de construire' },
  { value: 'titre_foncier',          label: 'Titre foncier' },
  { value: 'attestation_recasement', label: 'Attestation de recasement' },
  { value: 'convention_vente',       label: 'Convention de vente' },
  { value: 'autre',                  label: 'Autre' },
];

const EQUIP_RESIDENTIEL = [
  { value: 'garage_auto',   label: 'Garage auto' },
  { value: 'garage_moto',   label: 'Garage moto' },
  { value: 'gardien',       label: 'Gardien / Sécurité' },
  { value: 'balcon',        label: 'Balcon' },
  { value: 'climatisation', label: 'Climatisation' },
  { value: 'chauffe_eau',   label: 'Chauffe-eau' },
  { value: 'baie_vitree',   label: 'Baies vitrées' },
];

const EQUIP_BOUTIQUE = [
  { value: 'toilette_interne', label: 'Toilette interne' },
  { value: 'arriere_boutique', label: 'Arrière-boutique / Stock' },
  { value: 'sol_carele',       label: 'Sol carrelé' },
  { value: 'plafond_staffe',   label: 'Plafond staffé' },
  { value: 'climatisation',    label: 'Climatisation' },
];

const ALENTOURS_OPTS = [
  { value: 'marche',      label: 'Marché' },
  { value: 'eglise',      label: 'Église / Cathédrale' },
  { value: 'mosquee',     label: 'Mosquée' },
  { value: 'ecole',       label: 'École primaire' },
  { value: 'lycee',       label: 'Collège / Lycée' },
  { value: 'universite',  label: 'Université / Campus' },
  { value: 'hopital',     label: 'Hôpital / Clinique' },
  { value: 'pharmacie',   label: 'Pharmacie' },
  { value: 'banque',      label: 'Banque / DAB' },
  { value: 'station',     label: 'Station-service' },
  { value: 'bar_maquis',  label: 'Bar / Maquis' },
  { value: 'restaurant',  label: 'Restaurant' },
  { value: 'taxi_zem',    label: 'Gare taxi / Zem' },
  { value: 'supermarche', label: 'Supermarché / Épicerie' },
  { value: 'plage',       label: 'Plage / Bord de mer' },
];

const STEPS = [
  { id: 1, label: 'Type & Prix' },
  { id: 2, label: 'Localisation' },
  { id: 3, label: 'Confort' },
  { id: 4, label: 'Honoraires' },
  { id: 5, label: 'Photos' },
];

/* ─── Helpers ────────────────────────────────────────────── */

function getTypeBackend(typeBien: string, estMeuble: boolean): string {
  if (typeBien === 'Terrain / Parcelle') return 'terrain';
  if (['Villa', 'Maison', 'Boutique / Local'].includes(typeBien)) return 'maison';
  if (typeBien === 'Appartement' && estMeuble) return 'appart_meuble';
  return 'appart_vide';
}

function getSousType(typeBien: string, estMeuble: boolean): string {
  if (typeBien === 'Terrain / Parcelle') return 'terrain';
  if (typeBien === 'Boutique / Local')   return 'boutique';
  if (typeBien === 'Chambre-Salon')      return 'chambre_salon';
  if (typeBien === 'Entrée-Coucher')     return 'entree_coucher';
  if (typeBien === 'Appartement')        return estMeuble ? 'appart_meuble' : 'appartement';
  if (typeBien === 'Villa')              return 'villa';
  if (typeBien === 'Maison')             return 'maison_individuelle';
  return typeBien.toLowerCase();
}

function buildPieces(
  typeBien: string, chambres: number, salons: number, cuisines: number, douches: number,
  isTerrain: boolean, isBoutique: boolean,
): { nom: string; surface: number }[] {
  if (isTerrain || isBoutique) return [];
  if (typeBien === 'Entrée-Coucher') {
    return [{ nom: 'Chambre', surface: 0 }, { nom: 'Entrée', surface: 0 }];
  }
  const p: { nom: string; surface: number }[] = [];
  for (let i = 0; i < chambres; i++) p.push({ nom: 'Chambre', surface: 0 });
  for (let i = 0; i < salons; i++)   p.push({ nom: 'Salon',   surface: 0 });
  if (typeBien !== 'Chambre-Salon') {
    for (let i = 0; i < cuisines; i++) p.push({ nom: 'Cuisine',        surface: 0 });
    for (let i = 0; i < douches; i++)  p.push({ nom: 'Salle de bain',  surface: 0 });
  }
  return p;
}

/* ─── Types ──────────────────────────────────────────────── */

type Form = {
  // Step 1
  typeBien: string; estMeuble: boolean; transaction: string;
  prix: string; prixPromo: string;
  tarifLongSejour: string; tarifSejRestreint: string; tarifHeure: string;
  // Step 2
  adresse: string; ville: string; arrondissement: string; quartier: string;
  latitude: string; longitude: string;
  // Step 3 résidentiel
  sanitaire: string; sanitaireAutre: string;
  finition: string;
  typeCuisine: string; cuisineAutre: string;
  typeCour: string; nbVoisins: number; accesVehicule: string; nbVehicules: number;
  chambreACouloir: boolean;
  avanceMois: number; echeanceMois: number; loyerPrePayeMois: number;
  cautionEau: string; cautionElec: string;
  electricite: string; prixKwh: string;
  eau: string; prixForage: string; prixM3: string; forageGestion: string;
  disponibilite: string;
  chambres: number; salons: number; cuisines: number; douches: number;
  // Step 3 terrain
  superficieTerrain: string; documentTerrain: string; positionTerrain: string;
  angleRue: boolean; permissionConstruire: boolean; descriptionConstruction: string;
  estLoti: string; titreFoncier: string;
  // Step 3 boutique
  typeVoie: string; visibiliteBoutique: string; parkingClients: string;
  // Step 4
  description: string; commission: string;
};

const INIT: Form = {
  typeBien: '', estMeuble: false, transaction: '',
  prix: '', prixPromo: '', tarifLongSejour: '', tarifSejRestreint: '', tarifHeure: '',
  adresse: '', ville: '', arrondissement: '', quartier: '',
  latitude: '6.3654', longitude: '2.4183',
  sanitaire: '', sanitaireAutre: '', finition: '',
  typeCuisine: 'separee_douche', cuisineAutre: '',
  typeCour: 'commune', nbVoisins: 0, accesVehicule: '', nbVehicules: 1,
  chambreACouloir: false,
  avanceMois: 0, echeanceMois: 5, loyerPrePayeMois: 0,
  cautionEau: '', cautionElec: '',
  electricite: 'non', prixKwh: '',
  eau: 'non', prixForage: '', prixM3: '', forageGestion: '',
  disponibilite: 'immediate',
  chambres: 1, salons: 1, cuisines: 1, douches: 1,
  superficieTerrain: '', documentTerrain: '', positionTerrain: 'bord_goudron',
  angleRue: false, permissionConstruire: false, descriptionConstruction: '',
  estLoti: '', titreFoncier: '',
  typeVoie: 'goudron', visibiliteBoutique: 'directe', parkingClients: 'aucun',
  description: '', commission: '',
};

/* ─── Composants UI ──────────────────────────────────────── */

function CheckSvg() {
  return (
    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
      <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function ArrowLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
  );
}
function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="pb-toggle" style={{ background: checked ? '#2563EB' : '#CBD5E1', cursor: 'pointer' }}
      onClick={() => onChange(!checked)} role="switch" aria-checked={checked}>
      <div className="pb-toggle-knob" style={{ left: checked ? 'calc(100% - 1.3125rem)' : '3px' }} />
    </div>
  );
}

function ChoiceItem({ label, sub, active, onClick }: { label: string; sub?: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`pb-choice-item${active ? ' pb-choice-item--active' : ''}`} onClick={onClick}>
      <div>
        <div className="pb-choice-label">{label}</div>
        {sub && <div className="pb-choice-sub">{sub}</div>}
      </div>
      {active && <div className="pb-choice-check"><CheckSvg /></div>}
    </button>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="immo-form-field">
      <label className="immo-form-label">{label}</label>
      {children}
      {error && <div className="pb-err">{error}</div>}
    </div>
  );
}

function MoneyField({ label, value, onChange, unit = 'FCFA', error }: {
  label: string; value: string; onChange: (v: string) => void; unit?: string; error?: string;
}) {
  return (
    <FormField label={label} error={error}>
      <div className="pb-input-group">
        <input type="number" value={value} onChange={e => onChange(e.target.value)} min="0" placeholder="0" />
        <div className="pb-input-unit">{unit}</div>
      </div>
    </FormField>
  );
}

function SelectNum({ label, value, onChange, options }: {
  label: string; value: number; onChange: (v: number) => void; options: number[];
}) {
  return (
    <FormField label={label}>
      <select className="immo-form-input" value={value} onChange={e => onChange(Number(e.target.value))}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </FormField>
  );
}

function ChipSelect({ options, selected, toggle }: {
  options: { value: string; label: string }[];
  selected: Set<string>;
  toggle: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(o => {
        const active = selected.has(o.value);
        return (
          <button key={o.value} type="button"
            onClick={() => toggle(o.value)}
            style={{
              padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${active ? '#2563EB' : 'var(--c-border)'}`,
              background: active ? '#2563EB' : 'var(--c-card)',
              color: active ? '#fff' : 'var(--c-text)',
              transition: 'all 0.15s',
            }}
          >{o.label}</button>
        );
      })}
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="pb-toggle-row">
      <div>
        <div className="pb-toggle-row-label">{label}</div>
        {desc && <div className="pb-toggle-row-desc">{desc}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

/* ─── Barre d'étapes ─────────────────────────────────────── */

function StepTrack({ current }: { current: number }) {
  return (
    <div className="pb-step-track">
      {STEPS.map((s, i) => {
        const done = s.id < current; const active = s.id === current;
        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', flex: i < STEPS.length - 1 ? '1' : 'none' }}>
            <div className="pb-step-col">
              <div className={`pb-step-circle ${done ? 'pb-step-circle--done' : active ? 'pb-step-circle--active' : 'pb-step-circle--future'}`}>
                {done ? <CheckSvg /> : s.id}
              </div>
              <span className={`pb-step-label ${active ? 'pb-step-label--active' : done ? 'pb-step-label--done' : ''}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`pb-step-connector${done ? ' pb-step-connector--done' : ''}`} />}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Page principale ────────────────────────────────────── */

export default function PublierBienPage() {
  const navigate = useNavigate();
  const [step, setStep]           = useState(1);
  const [form, setForm]           = useState<Form>(INIT);
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  // Sets pour multi-sélection
  const [equipements, setEquipements] = useState<Set<string>>(new Set());
  const [alentours, setAlentours]     = useState<Set<string>>(new Set());

  // Autres frais (dynamique)
  const [autresFrais, setAutresFrais] = useState<{ label: string; montant: string }[]>([]);

  // Photos & Vidéo
  const [photos, setPhotos]           = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [video, setVideo]             = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof Form, val: any) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const isTerrain  = form.typeBien === 'Terrain / Parcelle';
  const isBoutique = form.typeBien === 'Boutique / Local';
  const isMeuble   = PEUT_ETRE_MEUBLE.includes(form.typeBien) && form.estMeuble;
  const isLocation = form.transaction === 'location';

  /* ── Validation ── */
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!form.typeBien)    e.typeBien    = 'Choisissez un type de bien';
      if (!form.transaction) e.transaction = 'Choisissez une transaction';
      if (!isMeuble && (!form.prix || Number(form.prix) <= 0)) e.prix = 'Le prix est obligatoire';
      if (isMeuble && !form.tarifLongSejour && !form.tarifSejRestreint && !form.tarifHeure)
        e.tarifs = 'Renseignez au moins un tarif';
    }
    if (step === 2) {
      if (!form.adresse.trim()) e.adresse = "L'adresse est obligatoire";
      if (!form.ville.trim())   e.ville   = 'La ville est obligatoire';
    }
    if (step === 3 && isTerrain) {
      if (!form.superficieTerrain || Number(form.superficieTerrain) <= 0) e.superficieTerrain = 'La superficie est obligatoire';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  /* ── Photos ── */
  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    const remaining = 5 - photos.length;
    const toAdd = arr.slice(0, remaining);
    setPhotos(prev => [...prev, ...toAdd]);
    toAdd.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => setPhotoPreviews(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };
  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  /* ── Payload ── */
  const buildPayload = () => {
    const backendType = getTypeBackend(form.typeBien, form.estMeuble);
    const sousType    = getSousType(form.typeBien, form.estMeuble);

    const amenites: any = { sous_type: sousType };

    try {
      const raw = sessionStorage.getItem('proprietaire_info');
      if (raw) amenites.proprietaire_info = JSON.parse(raw);
    } catch { /* noop */ }

    if (form.arrondissement.trim()) amenites.arrondissement = form.arrondissement.trim();

    if (isTerrain) {
      if (form.documentTerrain) amenites.document = form.documentTerrain;
      amenites.position = form.positionTerrain;
      amenites.angle_rue = form.angleRue;
      amenites.permission_construire = form.permissionConstruire;
      if (form.permissionConstruire && form.descriptionConstruction.trim())
        amenites.description_construction = form.descriptionConstruction.trim();
      if (form.estLoti)     amenites.loti          = form.estLoti === 'oui';
      if (form.titreFoncier) amenites.titre_foncier = form.titreFoncier === 'oui';
    } else {
      if (form.sanitaire === 'interieur') amenites.sanitaire = true;
      else if (form.sanitaire === 'cour') amenites.sanitaire = false;
      else if (form.sanitaire === 'autre' && form.sanitaireAutre.trim())
        amenites.sanitaire_autre = form.sanitaireAutre.trim();
      if (form.finition) amenites.finition = form.finition;
      amenites.disponibilite = form.disponibilite;
      if (equipements.size) amenites.equipements = [...equipements];
      if (alentours.size)   amenites.voisinage    = [...alentours];

      if (isBoutique) {
        amenites.type_voie       = form.typeVoie;
        amenites.visibilite      = form.visibiliteBoutique;
        amenites.parking_clients = form.parkingClients;
      } else {
        amenites.type_cuisine = form.typeCuisine;
        if (form.typeCuisine === 'autre' && form.cuisineAutre.trim())
          amenites.cuisine_autre_detail = form.cuisineAutre.trim();
        amenites.type_cour = form.typeCour;
        if (form.typeCour === 'commune') {
          amenites.nb_voisins = form.nbVoisins;
          if (form.accesVehicule) amenites.acces_vehicule = form.accesVehicule === 'oui';
          if (form.accesVehicule === 'oui') amenites.nb_vehicules = form.nbVehicules;
        }
        if (form.typeBien === 'Chambre-Salon') amenites.chambre_couloir = form.chambreACouloir;
        amenites.avance_mois = form.avanceMois;
        if (form.loyerPrePayeMois > 0) amenites.loyer_prepaye_mois = form.loyerPrePayeMois;
        if (isLocation) {
          amenites.echeance_mois    = form.echeanceMois;
          amenites.commission_agence = form.commission
            ? Number(form.commission)
            : Number(form.prix) * 0.5;
        }
        if (Number(form.cautionEau)  > 0) amenites.caution_eau  = Number(form.cautionEau);
        if (Number(form.cautionElec) > 0) amenites.caution_elec = Number(form.cautionElec);
        amenites.electricite = form.electricite;
        if (form.electricite === 'decompteur' && Number(form.prixKwh) > 0)
          amenites.prix_kwh = Number(form.prixKwh);
        amenites.eau = form.eau;
        if (form.eau === 'forage' && Number(form.prixForage) > 0)
          amenites.prix_forage = Number(form.prixForage);
        if (form.eau === 'decompteur_soneb' && Number(form.prixM3) > 0)
          amenites.prix_m3 = Number(form.prixM3);
        if (form.eau === 'forage' && form.forageGestion)
          amenites.forage_gestion = form.forageGestion;
        if (isMeuble) {
          const tarifs: any = {};
          if (Number(form.tarifLongSejour)   > 0) tarifs.prix_long_sejour     = Number(form.tarifLongSejour);
          if (Number(form.tarifSejRestreint) > 0) tarifs.prix_sejour_restreint = Number(form.tarifSejRestreint);
          if (Number(form.tarifHeure)        > 0) tarifs.prix_heure            = Number(form.tarifHeure);
          if (Object.keys(tarifs).length) amenites.tarifs_meuble = tarifs;
        }
      }
    }

    const validFrais = autresFrais.filter(f => Number(f.montant) > 0);
    if (validFrais.length)
      amenites.autres_frais = validFrais.map(f => ({ label: f.label.trim() || 'Autre frais', montant: Number(f.montant) }));

    const localisation: any = {
      adresse:   form.adresse.trim(),
      ville:     form.ville.trim(),
      latitude:  Number(form.latitude)  || 6.3654,
      longitude: Number(form.longitude) || 2.4183,
    };
    if (form.quartier.trim()) localisation.quartier = form.quartier.trim();

    const prix = isMeuble
      ? (Number(form.tarifLongSejour) || Number(form.tarifSejRestreint) || Number(form.tarifHeure) || Number(form.prix))
      : Number(form.prix);

    const payload: any = { type: backendType, transaction: form.transaction, prix, localisation, amenites };
    if (form.description.trim())       payload.description = form.description.trim();
    if (Number(form.prixPromo) > 0)    payload.prix_promo  = Number(form.prixPromo);

    const pieces = buildPieces(form.typeBien, form.chambres, form.salons, form.cuisines, form.douches, isTerrain, isBoutique);
    if (pieces.length) payload.pieces = pieces;

    if (isTerrain && Number(form.superficieTerrain) > 0)
      payload.details_terrain = { superficie: Number(form.superficieTerrain), cloture: false };
    else if (backendType === 'appart_vide' || backendType === 'appart_meuble')
      payload.details_appart = { entree_personnelle: form.typeCour === 'entree_personnelle' };

    return payload;
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      setSubmitStatus('Publication du bien…');
      const bien = await postBien.create(buildPayload());
      const bienId = bien?.id ?? bien?.data?.id ?? bien?.bien?.id;

      if (bienId) {
        for (let i = 0; i < photos.length; i++) {
          setSubmitStatus(`Envoi des photos (${i + 1}/${photos.length})…`);
          try { await postBien.uploadPhoto(bienId, photos[i]); } catch { /* non-bloquant */ }
        }
        if (video) {
          setSubmitStatus('Envoi de la vidéo…');
          try { await postBien.uploadVideo(bienId, video); } catch { /* non-bloquant */ }
        }
      }

      sessionStorage.removeItem('proprietaire_info');
      navigate('/mes-annonces');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      alert(Array.isArray(msg) ? msg.join('\n') : (msg ?? 'Erreur lors de la publication.'));
      setSubmitting(false);
      setSubmitStatus('');
    }
  };

  /* ── Render ── */
  return (
    <div className="pb-page">

      <div className="pb-page-header">
        <div>
          <h1 className="pb-page-title">Publier un bien</h1>
          <p className="pb-page-sub">Renseignez toutes les informations de l'annonce</p>
        </div>
        <button className="pb-cancel-btn" onClick={() => navigate('/mes-annonces')}>Annuler</button>
      </div>

      <StepTrack current={step} />

      {/* ══ Étape 1 — Type & Prix ══ */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Type */}
          <div className="immo-card" style={{ padding: '1.5rem' }}>
            <p className="pb-section-head">Type de bien</p>
            {errors.typeBien && <div className="pb-err" style={{ marginBottom: 8 }}>{errors.typeBien}</div>}
            <div className="pb-type-grid">
              {TYPES_BIEN.map(t => (
                <button key={t.display} type="button"
                  className={`pb-type-btn${form.typeBien === t.display ? ' pb-type-active' : ''}`}
                  onClick={() => { set('typeBien', t.display); set('estMeuble', false); }}>
                  <div className="pb-type-name">{t.display}</div>
                  <div className="pb-type-desc">{t.desc}</div>
                </button>
              ))}
            </div>

            {/* Meublé toggle */}
            {PEUT_ETRE_MEUBLE.includes(form.typeBien) && (
              <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--c-bg)', borderRadius: 10, border: '1px solid var(--c-border)' }}>
                <ToggleRow
                  label="Bien meublé"
                  desc="Logement fourni avec mobilier et équipements"
                  checked={form.estMeuble}
                  onChange={v => set('estMeuble', v)}
                />
              </div>
            )}
          </div>

          {/* Transaction */}
          <div className="immo-card" style={{ padding: '1.5rem' }}>
            <p className="pb-section-head">Type de transaction</p>
            {errors.transaction && <div className="pb-err" style={{ marginBottom: 8 }}>{errors.transaction}</div>}
            <div className="pb-trans-row">
              <button type="button" className={`pb-trans-btn${form.transaction === 'location' ? ' pb-trans-active' : ''}`}
                onClick={() => set('transaction', 'location')}>
                <div className="pb-trans-title">Location</div>
                <div className="pb-trans-sub">Mise en location mensuelle avec loyer</div>
              </button>
              <button type="button" className={`pb-trans-btn${form.transaction === 'vente' ? ' pb-trans-active' : ''}`}
                onClick={() => set('transaction', 'vente')}>
                <div className="pb-trans-title">Vente</div>
                <div className="pb-trans-sub">Cession définitive du bien à l'acheteur</div>
              </button>
            </div>
          </div>

          {/* Prix */}
          {form.typeBien && form.transaction && (
            <div className="immo-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {!isMeuble ? (
                <>
                  <MoneyField
                    label={isLocation ? 'Loyer mensuel *' : 'Prix de vente *'}
                    value={form.prix} onChange={v => set('prix', v)} error={errors.prix}
                  />
                  <MoneyField label="Prix promotionnel (optionnel)" value={form.prixPromo} onChange={v => set('prixPromo', v)} />
                </>
              ) : (
                <>
                  <p className="pb-section-head">Tarifs</p>
                  {errors.tarifs && <div className="pb-err" style={{ marginBottom: 8 }}>{errors.tarifs}</div>}
                  <MoneyField label="Prix long séjour / nuit" value={form.tarifLongSejour} onChange={v => set('tarifLongSejour', v)} />
                  <MoneyField label="Prix court séjour / nuit" value={form.tarifSejRestreint} onChange={v => set('tarifSejRestreint', v)} />
                  <MoneyField label="Prix à l'heure" value={form.tarifHeure} onChange={v => set('tarifHeure', v)} />
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ Étape 2 — Localisation ══ */}
      {step === 2 && (
        <div className="immo-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <FormField label="Adresse *" error={errors.adresse}>
            <input className="immo-form-input" value={form.adresse} onChange={e => set('adresse', e.target.value)}
              placeholder="Ex : Lot 42, Rue des Cocotiers" />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <FormField label="Ville *" error={errors.ville}>
              <input className="immo-form-input" value={form.ville} onChange={e => set('ville', e.target.value)}
                placeholder="Ex : Cotonou" />
            </FormField>
            <FormField label="Arrondissement">
              <input className="immo-form-input" value={form.arrondissement} onChange={e => set('arrondissement', e.target.value)}
                placeholder="Ex : Cadjèhoun" />
            </FormField>
          </div>
          <FormField label="Quartier">
            <input className="immo-form-input" value={form.quartier} onChange={e => set('quartier', e.target.value)}
              placeholder="Ex : Haie Vive" />
          </FormField>
          <div className="pb-section-divider" />
          <p className="pb-section-head">Coordonnées GPS <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(pré-remplies sur Cotonou)</span></p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <FormField label="Latitude">
              <input className="immo-form-input" type="number" value={form.latitude} onChange={e => set('latitude', e.target.value)} />
            </FormField>
            <FormField label="Longitude">
              <input className="immo-form-input" type="number" value={form.longitude} onChange={e => set('longitude', e.target.value)} />
            </FormField>
          </div>
        </div>
      )}

      {/* ══ Étape 3 — Confort ══ */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* ── TERRAIN ── */}
          {isTerrain && (
            <>
              <div className="immo-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <p className="pb-section-head">Superficie & Document</p>
                <MoneyField label="Superficie *" value={form.superficieTerrain}
                  onChange={v => set('superficieTerrain', v)} unit="m²" error={errors.superficieTerrain} />
                <FormField label="Document disponible">
                  <select className="immo-form-input" value={form.documentTerrain} onChange={e => set('documentTerrain', e.target.value)}>
                    <option value="">— Choisir —</option>
                    {DOC_TERRAIN_OPTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </FormField>
              </div>

              <div className="immo-card" style={{ padding: '1.5rem' }}>
                <p className="pb-section-head" style={{ marginBottom: '1rem' }}>Position & Caractéristiques</p>
                <p className="pb-section-head" style={{ fontSize: 11, marginBottom: 8 }}>Position</p>
                <div className="pb-choices" style={{ marginBottom: '1rem' }}>
                  {[
                    { value: 'bord_goudron', label: 'Bord goudron', sub: 'Accès direct sur route goudronnée' },
                    { value: 'ruelle',       label: 'Ruelle',       sub: 'Accès par voie secondaire' },
                  ].map(o => (
                    <ChoiceItem key={o.value} label={o.label} sub={o.sub}
                      active={form.positionTerrain === o.value}
                      onClick={() => set('positionTerrain', o.value)} />
                  ))}
                </div>
                <div className="pb-toggle-list">
                  <ToggleRow label="Angle de rue" desc="Parcelle en angle, double façade"
                    checked={form.angleRue} onChange={v => set('angleRue', v)} />
                  <ToggleRow label="Permission de construire" desc="Document de permis disponible"
                    checked={form.permissionConstruire} onChange={v => set('permissionConstruire', v)} />
                </div>
                {form.permissionConstruire && (
                  <div style={{ marginTop: '1rem' }}>
                    <FormField label="Description de la construction autorisée">
                      <textarea className="immo-form-input" rows={2} style={{ resize: 'vertical' }}
                        value={form.descriptionConstruction}
                        onChange={e => set('descriptionConstruction', e.target.value)}
                        placeholder="Ex : R+2, usage mixte…" />
                    </FormField>
                  </div>
                )}
                <div className="pb-section-divider" />
                <p className="pb-section-head" style={{ margin: '1rem 0 0.75rem' }}>Statut foncier</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { key: 'estLoti',      label: 'Terrain loti' },
                    { key: 'titreFoncier', label: 'Titre foncier' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text)', marginBottom: 6 }}>{label}</div>
                      <div className="pb-choices">
                        {[{ value: 'oui', label: 'Oui' }, { value: 'non', label: 'Non' }].map(o => (
                          <ChoiceItem key={o.value} label={o.label}
                            active={(form as any)[key] === o.value}
                            onClick={() => set(key as keyof Form, (form as any)[key] === o.value ? '' : o.value)} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="immo-card" style={{ padding: '1.5rem' }}>
                <p className="pb-section-head" style={{ marginBottom: '1rem' }}>Alentours</p>
                <ChipSelect options={ALENTOURS_OPTS} selected={alentours}
                  toggle={v => setAlentours(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n; })} />
              </div>
            </>
          )}

          {/* ── BOUTIQUE ── */}
          {isBoutique && (
            <>
              <div className="immo-card" style={{ padding: '1.5rem' }}>
                <p className="pb-section-head" style={{ marginBottom: '1rem' }}>Caractéristiques du local</p>
                <FormField label="Type de voie">
                  <select className="immo-form-input" value={form.typeVoie} onChange={e => set('typeVoie', e.target.value)}>
                    <option value="goudron">Bord goudron</option>
                    <option value="ruelle">Ruelle / voie secondaire</option>
                    <option value="voie_pavee">Voie pavée</option>
                  </select>
                </FormField>
                <div style={{ height: 12 }} />
                <FormField label="Visibilité">
                  <select className="immo-form-input" value={form.visibiliteBoutique} onChange={e => set('visibiliteBoutique', e.target.value)}>
                    <option value="directe">Directe — bien exposée</option>
                    <option value="partiellement">Partiellement visible</option>
                    <option value="peu_visible">Peu visible</option>
                  </select>
                </FormField>
                <div style={{ height: 12 }} />
                <FormField label="Parking clients">
                  <select className="immo-form-input" value={form.parkingClients} onChange={e => set('parkingClients', e.target.value)}>
                    <option value="aucun">Aucun</option>
                    <option value="espace_devant">Espace devant la boutique</option>
                    <option value="parking_propre">Parking propre au local</option>
                  </select>
                </FormField>
              </div>

              <div className="immo-card" style={{ padding: '1.5rem' }}>
                <p className="pb-section-head" style={{ marginBottom: '1rem' }}>Sanitaire & Finition</p>
                <div className="pb-choices" style={{ marginBottom: '1.25rem' }}>
                  {SANITAIRE_OPTS.map(o => (
                    <ChoiceItem key={o.value} label={o.label} sub={o.sub}
                      active={form.sanitaire === o.value}
                      onClick={() => set('sanitaire', form.sanitaire === o.value ? '' : o.value)} />
                  ))}
                </div>
                {form.sanitaire === 'autre' && (
                  <input className="immo-form-input" style={{ marginBottom: '1rem' }} value={form.sanitaireAutre}
                    onChange={e => set('sanitaireAutre', e.target.value)} placeholder="Précisez le sanitaire" />
                )}
                <div className="pb-section-divider" />
                <p className="pb-section-head" style={{ margin: '1rem 0 1rem' }}>Finition</p>
                <div className="pb-choices">
                  {FINITION_OPTS.map(o => (
                    <ChoiceItem key={o.value} label={o.label} sub={o.sub}
                      active={form.finition === o.value}
                      onClick={() => set('finition', form.finition === o.value ? '' : o.value)} />
                  ))}
                </div>
              </div>

              <div className="immo-card" style={{ padding: '1.5rem' }}>
                <p className="pb-section-head" style={{ marginBottom: '1rem' }}>Disponibilité</p>
                <div className="pb-choices">
                  {[{ value: 'immediate', label: 'Immédiate', sub: 'Disponible dès maintenant' }, { value: 'a_convenir', label: 'À convenir', sub: 'Date à fixer avec le propriétaire' }].map(o => (
                    <ChoiceItem key={o.value} label={o.label} sub={o.sub}
                      active={form.disponibilite === o.value}
                      onClick={() => set('disponibilite', o.value)} />
                  ))}
                </div>
              </div>

              <div className="immo-card" style={{ padding: '1.5rem' }}>
                <p className="pb-section-head" style={{ marginBottom: '1rem' }}>Équipements</p>
                <ChipSelect options={EQUIP_BOUTIQUE} selected={equipements}
                  toggle={v => setEquipements(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n; })} />
                <div className="pb-section-divider" />
                <p className="pb-section-head" style={{ margin: '1rem 0 1rem' }}>Alentours</p>
                <ChipSelect options={ALENTOURS_OPTS} selected={alentours}
                  toggle={v => setAlentours(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n; })} />
              </div>
            </>
          )}

          {/* ── RÉSIDENTIEL ── */}
          {!isTerrain && !isBoutique && (
            <>
              {/* Sanitaire & Finition */}
              <div className="immo-card" style={{ padding: '1.5rem' }}>
                <p className="pb-section-head">Sanitaire</p>
                <div className="pb-choices" style={{ margin: '1rem 0' }}>
                  {SANITAIRE_OPTS.map(o => (
                    <ChoiceItem key={o.value} label={o.label} sub={o.sub}
                      active={form.sanitaire === o.value}
                      onClick={() => set('sanitaire', form.sanitaire === o.value ? '' : o.value)} />
                  ))}
                </div>
                {form.sanitaire === 'autre' && (
                  <input className="immo-form-input" style={{ marginBottom: '1rem' }} value={form.sanitaireAutre}
                    onChange={e => set('sanitaireAutre', e.target.value)} placeholder="Précisez le sanitaire" />
                )}
                <div className="pb-section-divider" />
                <p className="pb-section-head" style={{ margin: '1rem 0 1rem' }}>Finition</p>
                <div className="pb-choices">
                  {FINITION_OPTS.map(o => (
                    <ChoiceItem key={o.value} label={o.label} sub={o.sub}
                      active={form.finition === o.value}
                      onClick={() => set('finition', form.finition === o.value ? '' : o.value)} />
                  ))}
                </div>
                <div className="pb-section-divider" />
                <p className="pb-section-head" style={{ margin: '1rem 0 1rem' }}>Type de cuisine</p>
                <div className="pb-choices">
                  {CUISINE_OPTS.map(o => (
                    <ChoiceItem key={o.value} label={o.label} sub={o.sub}
                      active={form.typeCuisine === o.value}
                      onClick={() => set('typeCuisine', o.value)} />
                  ))}
                </div>
                {form.typeCuisine === 'autre' && (
                  <input className="immo-form-input" style={{ marginTop: '0.75rem' }} value={form.cuisineAutre}
                    onChange={e => set('cuisineAutre', e.target.value)} placeholder="Précisez le type de cuisine" />
                )}
              </div>

              {/* Type de cour */}
              <div className="immo-card" style={{ padding: '1.5rem' }}>
                <p className="pb-section-head" style={{ marginBottom: '1rem' }}>Type de cour</p>
                <div className="pb-choices" style={{ marginBottom: '1rem' }}>
                  {[
                    { value: 'commune',            label: 'Cour commune',      sub: 'Partagée entre plusieurs occupants' },
                    { value: 'entree_personnelle', label: 'Entrée personnelle', sub: 'Entrée propre, séparée des voisins' },
                  ].map(o => (
                    <ChoiceItem key={o.value} label={o.label} sub={o.sub}
                      active={form.typeCour === o.value}
                      onClick={() => set('typeCour', o.value)} />
                  ))}
                </div>
                {form.typeCour === 'commune' && (
                  <>
                    <SelectNum label="Nombre de voisins" value={form.nbVoisins}
                      onChange={v => set('nbVoisins', v)}
                      options={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} />
                    <div style={{ height: 12 }} />
                    <p className="pb-section-head" style={{ fontSize: 11, marginBottom: 8 }}>Accès véhicule</p>
                    <div className="pb-choices" style={{ marginBottom: '1rem' }}>
                      {[{ value: 'oui', label: 'Oui' }, { value: 'non', label: 'Non' }].map(o => (
                        <ChoiceItem key={o.value} label={o.label}
                          active={form.accesVehicule === o.value}
                          onClick={() => set('accesVehicule', form.accesVehicule === o.value ? '' : o.value)} />
                      ))}
                    </div>
                    {form.accesVehicule === 'oui' && (
                      <SelectNum label="Nombre de places" value={form.nbVehicules}
                        onChange={v => set('nbVehicules', v)} options={[1, 2, 3, 4, 5]} />
                    )}
                  </>
                )}
                {form.typeBien === 'Chambre-Salon' && (
                  <>
                    <div className="pb-section-divider" />
                    <div style={{ marginTop: '1rem' }}>
                      <ToggleRow label="Chambre à couloir" desc="Chambre avec couloir d'accès indépendant"
                        checked={form.chambreACouloir} onChange={v => set('chambreACouloir', v)} />
                    </div>
                  </>
                )}
              </div>

              {/* Pièces */}
              {form.typeBien !== 'Entrée-Coucher' && (
                <div className="immo-card" style={{ padding: '1.5rem' }}>
                  <p className="pb-section-head" style={{ marginBottom: '1rem' }}>Composition du logement</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <SelectNum label="Chambres" value={form.chambres} onChange={v => set('chambres', v)} options={[1, 2, 3, 4, 5, 6]} />
                    <SelectNum label="Salons" value={form.salons} onChange={v => set('salons', v)} options={[0, 1, 2, 3]} />
                    {form.typeBien !== 'Chambre-Salon' && (
                      <>
                        <SelectNum label="Cuisines" value={form.cuisines} onChange={v => set('cuisines', v)} options={[0, 1, 2]} />
                        <SelectNum label="Salles de bain" value={form.douches} onChange={v => set('douches', v)} options={[0, 1, 2, 3]} />
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Conditions financières */}
              <div className="immo-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <p className="pb-section-head">Conditions financières</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                  <SelectNum label="Avance (mois)" value={form.avanceMois}
                    onChange={v => set('avanceMois', v)} options={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]} />
                  <SelectNum label="Loyer prépayé (mois)" value={form.loyerPrePayeMois}
                    onChange={v => set('loyerPrePayeMois', v)} options={[0, 1, 2, 3, 4, 5, 6]} />
                  {isLocation && (
                    <SelectNum label="Échéance (mois)" value={form.echeanceMois}
                      onChange={v => set('echeanceMois', v)} options={[1, 2, 3, 4, 5, 6, 12]} />
                  )}
                </div>
                <div style={{ height: 4 }} />
                <MoneyField label="Caution eau" value={form.cautionEau} onChange={v => set('cautionEau', v)} />
                <MoneyField label="Caution électricité" value={form.cautionElec} onChange={v => set('cautionElec', v)} />
              </div>

              {/* Électricité */}
              <div className="immo-card" style={{ padding: '1.5rem' }}>
                <p className="pb-section-head" style={{ marginBottom: '1rem' }}>Électricité</p>
                <div className="pb-choices" style={{ marginBottom: '0.75rem' }}>
                  {[
                    { value: 'non',        label: 'Non',          sub: 'Pas d\'électricité' },
                    { value: 'sbee',       label: 'SBEE',         sub: 'Compteur SBEE normal' },
                    { value: 'decompteur', label: 'Décompteur',   sub: 'Compteur partagé avec tarif' },
                  ].map(o => (
                    <ChoiceItem key={o.value} label={o.label} sub={o.sub}
                      active={form.electricite === o.value}
                      onClick={() => set('electricite', o.value)} />
                  ))}
                </div>
                {form.electricite === 'decompteur' && (
                  <MoneyField label="Prix du kWh" value={form.prixKwh} onChange={v => set('prixKwh', v)} unit="FCFA/kWh" />
                )}

                <div className="pb-section-divider" />
                <p className="pb-section-head" style={{ margin: '1rem 0 1rem' }}>Eau</p>
                <div className="pb-choices" style={{ marginBottom: '0.75rem' }}>
                  {[
                    { value: 'non',            label: 'Non',              sub: 'Pas d\'eau courante' },
                    { value: 'soneb',          label: 'SONEB',            sub: 'Compteur SONEB normal' },
                    { value: 'decompteur_soneb',label: 'Décompteur SONEB', sub: 'Compteur partagé' },
                    { value: 'forage',         label: 'Forage',           sub: 'Pompe forage' },
                  ].map(o => (
                    <ChoiceItem key={o.value} label={o.label} sub={o.sub}
                      active={form.eau === o.value}
                      onClick={() => set('eau', o.value)} />
                  ))}
                </div>
                {form.eau === 'decompteur_soneb' && (
                  <MoneyField label="Prix au m³" value={form.prixM3} onChange={v => set('prixM3', v)} unit="FCFA/m³" />
                )}
                {form.eau === 'forage' && (
                  <>
                    <MoneyField label="Prix forage / mois" value={form.prixForage} onChange={v => set('prixForage', v)} />
                    <div style={{ height: 8 }} />
                    <p className="pb-section-head" style={{ fontSize: 11, marginBottom: 8 }}>Gestion du forage</p>
                    <div className="pb-choices">
                      {[{ value: 'voisins', label: 'Entre voisins' }, { value: 'mensuel', label: 'Mensuel fixe' }].map(o => (
                        <ChoiceItem key={o.value} label={o.label}
                          active={form.forageGestion === o.value}
                          onClick={() => set('forageGestion', form.forageGestion === o.value ? '' : o.value)} />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Disponibilité */}
              <div className="immo-card" style={{ padding: '1.5rem' }}>
                <p className="pb-section-head" style={{ marginBottom: '1rem' }}>Disponibilité</p>
                <div className="pb-choices">
                  {[
                    { value: 'immediate',  label: 'Immédiate',  sub: 'Disponible dès maintenant' },
                    { value: 'a_convenir', label: 'À convenir', sub: 'Date à fixer avec le propriétaire' },
                  ].map(o => (
                    <ChoiceItem key={o.value} label={o.label} sub={o.sub}
                      active={form.disponibilite === o.value}
                      onClick={() => set('disponibilite', o.value)} />
                  ))}
                </div>
              </div>

              {/* Équipements & Alentours */}
              <div className="immo-card" style={{ padding: '1.5rem' }}>
                <p className="pb-section-head" style={{ marginBottom: '1rem' }}>Équipements</p>
                <ChipSelect options={EQUIP_RESIDENTIEL} selected={equipements}
                  toggle={v => setEquipements(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n; })} />
                <div className="pb-section-divider" />
                <p className="pb-section-head" style={{ margin: '1rem 0 1rem' }}>Alentours</p>
                <ChipSelect options={ALENTOURS_OPTS} selected={alentours}
                  toggle={v => setAlentours(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n; })} />
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ Étape 4 — Honoraires ══ */}
      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div className="immo-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <p className="pb-section-head">Description générale</p>
            <FormField label="Description du bien (optionnel)">
              <textarea className="immo-form-input" rows={4} style={{ resize: 'vertical', marginTop: 4 }}
                value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Décrivez le bien, ses atouts, l'environnement, les points forts…" />
            </FormField>
            {isLocation && !isMeuble && (
              <>
                <div className="pb-section-divider" />
                <MoneyField label="Commission agence (optionnel — par défaut 50 % du loyer)"
                  value={form.commission} onChange={v => set('commission', v)} />
              </>
            )}
          </div>

          <div className="immo-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <p className="pb-section-head" style={{ marginBottom: 0 }}>Autres frais</p>
              <button type="button" onClick={() => setAutresFrais(prev => [...prev, { label: '', montant: '' }])}
                style={{ fontSize: 12, fontWeight: 600, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
                + Ajouter un frais
              </button>
            </div>
            {autresFrais.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--c-muted)', textAlign: 'center', padding: '1rem 0' }}>Aucun frais supplémentaire</div>
            )}
            {autresFrais.map((f, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, marginBottom: 10, alignItems: 'end' }}>
                <div className="immo-form-field">
                  <label className="immo-form-label">Libellé</label>
                  <input className="immo-form-input" placeholder="Ex : Frais de dossier"
                    value={f.label} onChange={e => setAutresFrais(prev => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
                </div>
                <div className="pb-input-group">
                  <input type="number" placeholder="0" value={f.montant}
                    onChange={e => setAutresFrais(prev => prev.map((x, j) => j === i ? { ...x, montant: e.target.value } : x))} />
                  <div className="pb-input-unit">FCFA</div>
                </div>
                <button type="button" onClick={() => setAutresFrais(prev => prev.filter((_, j) => j !== i))}
                  style={{ height: 38, width: 38, borderRadius: 8, border: '1px solid var(--c-border)', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ Étape 5 — Photos & Vidéo ══ */}
      {step === 5 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Photos */}
          <div className="immo-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <p className="pb-section-head" style={{ marginBottom: 2 }}>Photos</p>
                <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>{photos.length}/5 photo{photos.length > 1 ? 's' : ''} — JPG, PNG, WEBP</div>
              </div>
              {photos.length < 5 && (
                <button type="button" onClick={() => photoInputRef.current?.click()}
                  style={{ fontSize: 12, fontWeight: 600, color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
                  + Ajouter des photos
                </button>
              )}
            </div>
            <input ref={photoInputRef} type="file" multiple accept="image/jpeg,image/jpg,image/png,image/webp"
              style={{ display: 'none' }} onChange={e => addPhotos(e.target.files)} />
            {photoPreviews.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                {photoPreviews.map((src, i) => (
                  <div key={i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '4/3' }}>
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => removePhoto(i)}
                      style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                    {i === 0 && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(37,99,235,0.85)', color: '#fff', fontSize: 10, fontWeight: 700, textAlign: 'center', padding: '3px 0' }}>
                        Photo principale
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div onClick={() => photoInputRef.current?.click()}
                style={{ border: '2px dashed var(--c-border)', borderRadius: 12, padding: '2.5rem', textAlign: 'center', cursor: 'pointer', color: 'var(--c-muted)' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Cliquez pour ajouter des photos</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>Maximum 5 photos</div>
              </div>
            )}
          </div>

          {/* Vidéo */}
          <div className="immo-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <p className="pb-section-head" style={{ marginBottom: 2 }}>Vidéo (optionnel)</p>
                <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>1 vidéo maximum — MP4</div>
              </div>
              {!video && (
                <button type="button" onClick={() => videoInputRef.current?.click()}
                  style={{ fontSize: 12, fontWeight: 600, color: '#7C3AED', background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
                  + Ajouter une vidéo
                </button>
              )}
            </div>
            <input ref={videoInputRef} type="file" accept="video/mp4,video/*" style={{ display: 'none' }}
              onChange={e => setVideo(e.target.files?.[0] ?? null)} />
            {video ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--c-bg)', borderRadius: 10, border: '1px solid var(--c-border)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                </svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{video.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>{(video.size / 1024 / 1024).toFixed(1)} Mo</div>
                </div>
                <button type="button" onClick={() => setVideo(null)}
                  style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  Retirer
                </button>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--c-muted)', textAlign: 'center', padding: '1rem 0' }}>Aucune vidéo sélectionnée</div>
            )}
          </div>

          {/* Récapitulatif */}
          <div className="immo-card" style={{ padding: '1.5rem' }}>
            <p className="pb-section-head" style={{ marginBottom: '1rem' }}>Récapitulatif</p>
            <div className="pb-recap-block">
              {[
                { k: 'Type',        v: form.typeBien + (isMeuble ? ' meublé' : '') },
                { k: 'Transaction', v: form.transaction === 'location' ? 'Location' : 'Vente' },
                { k: 'Prix',        v: isMeuble ? (form.tarifLongSejour ? `${Number(form.tarifLongSejour).toLocaleString('fr-FR')} FCFA/nuit` : '—') : `${Number(form.prix).toLocaleString('fr-FR')} FCFA` },
                { k: 'Ville',       v: form.ville || '—' },
                { k: 'Quartier',    v: form.quartier || '—' },
                { k: 'Photos',      v: `${photos.length} photo${photos.length > 1 ? 's' : ''}` },
                ...(video ? [{ k: 'Vidéo', v: video.name }] : []),
              ].map((r, i) => (
                <div key={i} className="pb-recap-row">
                  <span className="pb-recap-key">{r.k}</span>
                  <span className="pb-recap-val">{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <div className="pb-nav">
        {step > 1 ? (
          <button type="button" className="pb-nav-back" onClick={back} disabled={submitting}>
            <ArrowLeft /> Précédent
          </button>
        ) : <div />}

        {step < STEPS.length ? (
          <button type="button" className="pb-nav-next" onClick={next}>
            Suivant <ArrowRight />
          </button>
        ) : (
          <button type="button" className="pb-nav-next" style={{ minWidth: 220 }}
            onClick={handleSubmit} disabled={submitting}>
            {submitting ? (submitStatus || 'Publication…') : 'Publier l\'annonce'}
          </button>
        )}
      </div>

    </div>
  );
}
