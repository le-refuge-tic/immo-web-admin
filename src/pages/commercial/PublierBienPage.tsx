import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postBien } from '../../api/postBien';

/* ─── Données de référence ───────────────────────────────── */

const TYPES_BIEN = [
  { value: 'maison',        label: 'Maison',             desc: 'Villa, maison individuelle, résidence' },
  { value: 'appart_vide',   label: 'Appartement vide',   desc: 'Studio, F2, F3 non meublé' },
  { value: 'appart_meuble', label: 'Appartement meublé', desc: 'Logement fourni avec meubles' },
  { value: 'guesthouse',    label: 'Guesthouse',         desc: 'Hébergement courte durée équipé' },
  { value: 'terrain',       label: 'Terrain',            desc: 'Parcelle nue, lotissement, terrain' },
];

const SOUS_TYPES: Record<string, { value: string; label: string; sub: string }[]> = {
  maison: [
    { value: 'chambre_salon',       label: 'Chambre-Salon',       sub: 'Pièce principale + salon séparé' },
    { value: 'entree_coucher',      label: 'Entrée-Coucher',      sub: 'Entrée indépendante avec chambre' },
    { value: 'villa',               label: 'Villa',               sub: 'Maison standing avec jardin ou piscine' },
    { value: 'maison_individuelle', label: 'Maison individuelle',  sub: 'Maison complète indépendante' },
    { value: 'villa_maison',        label: 'Villa / Maison',      sub: 'Résidence de type villa ou grande maison' },
  ],
  appart_vide: [
    { value: 'appartement',         label: 'Appartement',         sub: 'Dans un immeuble ou résidence' },
    { value: 'villa',               label: 'Villa',               sub: 'En immeuble de type standing' },
    { value: 'maison_individuelle', label: 'Maison individuelle',  sub: 'Maison indépendante' },
  ],
  appart_meuble: [
    { value: 'appartement',         label: 'Appartement meublé',  sub: 'Meubles et équipements inclus' },
    { value: 'villa',               label: 'Villa meublée',       sub: 'Villa avec mobilier complet' },
  ],
};

const SANITAIRE_OPTS = [
  { value: 'interieur', label: 'Sanitaire intérieur',   sub: 'Douche intégrée au logement' },
  { value: 'cour',      label: 'Non sanitaire',         sub: 'Douche extérieure ou commune' },
  { value: 'autre',     label: 'Autre à préciser',      sub: '' },
];

const FINITION_OPTS = [
  { value: 'ordinaire',     label: 'Ordinaire',          sub: 'Finition de base, fonctionnel' },
  { value: 'semi_staffe',   label: 'Semi-Staffé',        sub: 'Salon staffé et carrelé, chambre propre' },
  { value: 'staffe_carele', label: 'Staffé',             sub: 'Staff complet et carreaux modernes' },
  { value: 'haut_standing', label: 'Haut Standing',      sub: 'Baies vitrées, douche moderne, clim' },
];

const CUISINE_OPTS = [
  { value: 'separee_douche', label: 'Cuisine séparée de la douche', sub: '' },
  { value: 'americaine',     label: 'Cuisine américaine',           sub: 'Ouverte sur le salon' },
  { value: 'autre',          label: 'Autre',                        sub: '' },
];

const DOC_TERRAIN_OPTS = [
  { value: 'permis_construire',        label: 'Permis de construire' },
  { value: 'titre_foncier',            label: 'Titre foncier' },
  { value: 'attestation_recasement',   label: 'Attestation de recasement' },
  { value: 'convention_vente',         label: 'Convention de vente' },
  { value: 'autre',                    label: 'Autre' },
];

const STEPS = [
  { id: 1, label: 'Type' },
  { id: 2, label: 'Transaction' },
  { id: 3, label: 'Prix' },
  { id: 4, label: 'Localisation' },
  { id: 5, label: 'Détails' },
];

/* ─── Types ──────────────────────────────────────────────── */

type Form = {
  type: string; sous_type: string;
  transaction: string;
  prix: string; prix_promo: string; frais_visite: string;
  avance_mois: string; caution_mois: string; commission_agence: string;
  adresse: string; ville: string; quartier: string; latitude: string; longitude: string;
  description: string; superficie: string;
  sanitaire: string; sanitaire_autre: string;
  finition: string; type_cuisine: string; cuisine_autre: string;
  cloture: boolean; titre_foncier: boolean; document_terrain: string;
  acces_vehicule: boolean; boyerie: boolean;
};

const INIT: Form = {
  type: '', sous_type: '', transaction: '',
  prix: '', prix_promo: '', frais_visite: '',
  avance_mois: '', caution_mois: '', commission_agence: '',
  adresse: '', ville: '', quartier: '', latitude: '6.3654', longitude: '2.4183',
  description: '', superficie: '',
  sanitaire: '', sanitaire_autre: '', finition: '', type_cuisine: '', cuisine_autre: '',
  cloture: false, titre_foncier: false, document_terrain: '',
  acces_vehicule: false, boyerie: false,
};

/* ─── Helpers UI ─────────────────────────────────────────── */

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
    <div
      className="pb-toggle"
      style={{ background: checked ? '#2563EB' : '#CBD5E1', cursor: 'pointer' }}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
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
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          min="0"
          placeholder="0"
        />
        <div className="pb-input-unit">{unit}</div>
      </div>
    </FormField>
  );
}

/* ─── Indicateur d'étapes ────────────────────────────────── */

function StepTrack({ current }: { current: number }) {
  return (
    <div className="pb-step-track">
      {STEPS.map((s, i) => {
        const done   = s.id < current;
        const active = s.id === current;
        const circleClass = done   ? 'pb-step-circle--done'
                          : active ? 'pb-step-circle--active'
                          :          'pb-step-circle--future';
        const labelClass  = active ? 'pb-step-label--active'
                          : done   ? 'pb-step-label--done'
                          :          '';
        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', flex: i < STEPS.length - 1 ? '1' : 'none' }}>
            <div className="pb-step-col">
              <div className={`pb-step-circle ${circleClass}`}>
                {done ? <CheckSvg /> : s.id}
              </div>
              <span className={`pb-step-label ${labelClass}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`pb-step-connector${done ? ' pb-step-connector--done' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Page principale ────────────────────────────────────── */

export default function PublierBienPage() {
  const navigate = useNavigate();
  const [step, setStep]       = useState(1);
  const [form, setForm]       = useState<Form>(INIT);
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof Form, val: any) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const isTerrain  = form.type === 'terrain';
  const isLocation = form.transaction === 'location';
  const sousList   = SOUS_TYPES[form.type] ?? [];

  /* ── Validation ── */
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 1 && !form.type)        e.type        = 'Choisissez un type de bien';
    if (step === 2 && !form.transaction) e.transaction = 'Choisissez une transaction';
    if (step === 3) {
      if (!form.prix || Number(form.prix) <= 0) e.prix = 'Le prix est obligatoire';
    }
    if (step === 4) {
      if (!form.adresse.trim()) e.adresse = 'L\'adresse est obligatoire';
      if (!form.ville.trim())   e.ville   = 'La ville est obligatoire';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const back = () => { setStep(s => s - 1); };

  /* ── Payload API ── */
  const buildPayload = () => {
    const amenites: any = {};
    if (form.sous_type) amenites.sous_type = form.sous_type;

    if (!isTerrain) {
      if (form.sanitaire)      amenites.sanitaire      = form.sanitaire !== 'cour';
      if (form.sanitaire_autre) amenites.sanitaire_autre = form.sanitaire_autre;
      if (form.finition)       amenites.finition       = form.finition;
      if (form.type_cuisine)   amenites.type_cuisine   = form.type_cuisine;
      if (form.cuisine_autre)  amenites.cuisine_autre_detail = form.cuisine_autre;
      amenites.acces_vehicule  = form.acces_vehicule;
      amenites.boyerie         = form.boyerie;
      if (isLocation) {
        if (form.avance_mois)      amenites.avance_mois      = Number(form.avance_mois);
        if (form.caution_mois)     amenites.caution_mois     = Number(form.caution_mois);
        if (form.commission_agence) amenites.commission_agence = Number(form.commission_agence);
      }
    } else {
      amenites.cloture        = form.cloture;
      amenites.titre_foncier  = form.titre_foncier;
      if (form.document_terrain) amenites.document = form.document_terrain;
    }

    const payload: any = {
      type:        form.type,
      transaction: form.transaction,
      prix:        Number(form.prix),
      localisation: {
        adresse:   form.adresse.trim(),
        ville:     form.ville.trim(),
        quartier:  form.quartier.trim() || undefined,
        latitude:  Number(form.latitude)  || 6.3654,
        longitude: Number(form.longitude) || 2.4183,
      },
      amenites,
    };

    if (form.description.trim()) payload.description  = form.description.trim();
    if (Number(form.prix_promo) > 0)   payload.prix_promo   = Number(form.prix_promo);
    if (Number(form.frais_visite) > 0) payload.frais_visite = Number(form.frais_visite);

    if (Number(form.superficie) > 0) {
      const sup = { superficie: Number(form.superficie), cloture: form.cloture };
      if (isTerrain) payload.details_terrain = sup;
      else           payload.details_maison  = sup;
    }

    return payload;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await postBien.create(buildPayload());
      navigate('/mes-annonces');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      alert(Array.isArray(msg) ? msg.join('\n') : (msg ?? 'Erreur lors de la publication.'));
      setSubmitting(false);
    }
  };

  /* ── Recap ── */
  const typeLabel  = TYPES_BIEN.find(t => t.value === form.type)?.label ?? form.type;
  const sousLabel  = sousList.find(s => s.value === form.sous_type)?.label;
  const transLabel = form.transaction === 'location' ? 'Location' : 'Vente';

  const recapRows = [
    { k: 'Type de bien',    v: typeLabel },
    ...(sousLabel ? [{ k: 'Sous-type', v: sousLabel }] : []),
    { k: 'Transaction',     v: transLabel },
    { k: 'Prix',            v: `${Number(form.prix).toLocaleString('fr-FR')} FCFA` },
    ...(Number(form.prix_promo) > 0 ? [{ k: 'Prix promo', v: `${Number(form.prix_promo).toLocaleString('fr-FR')} FCFA` }] : []),
    ...(isLocation && Number(form.avance_mois) > 0  ? [{ k: 'Avance',  v: `${form.avance_mois} mois` }] : []),
    ...(isLocation && Number(form.caution_mois) > 0 ? [{ k: 'Caution', v: `${form.caution_mois} mois` }] : []),
    { k: 'Adresse', v: form.adresse },
    { k: 'Ville',   v: form.ville },
    ...(form.quartier ? [{ k: 'Quartier', v: form.quartier }] : []),
    ...(Number(form.superficie) > 0 ? [{ k: 'Superficie', v: `${form.superficie} m²` }] : []),
    ...(form.description ? [{ k: 'Description', v: form.description.slice(0, 80) + (form.description.length > 80 ? '…' : '') }] : []),
  ];

  return (
    <div className="pb-page">

      {/* En-tête */}
      <div className="pb-page-header">
        <div>
          <h1 className="pb-page-title">Publier un bien</h1>
          <p className="pb-page-sub">Renseignez les informations de votre annonce</p>
        </div>
        <button className="pb-cancel-btn" onClick={() => navigate('/mes-annonces')}>
          Annuler
        </button>
      </div>

      {/* Barre étapes */}
      <StepTrack current={step} />

      {/* ══ Étape 1 — Type de bien ══ */}
      {step === 1 && (
        <div className="immo-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <p className="pb-section-head">Type de bien</p>
            <div className="pb-type-grid">
              {TYPES_BIEN.map(t => (
                <button
                  key={t.value}
                  type="button"
                  className={`pb-type-btn${form.type === t.value ? ' pb-type-active' : ''}`}
                  onClick={() => { set('type', t.value); set('sous_type', ''); }}
                >
                  <div className="pb-type-name">{t.label}</div>
                  <div className="pb-type-desc">{t.desc}</div>
                </button>
              ))}
            </div>
            {errors.type && <div className="pb-err" style={{ marginTop: '0.5rem' }}>{errors.type}</div>}
          </div>

          {sousList.length > 0 && (
            <div>
              <p className="pb-section-head">Préciser le sous-type <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optionnel)</span></p>
              <div className="pb-choices">
                {sousList.map(s => (
                  <ChoiceItem
                    key={s.value}
                    label={s.label}
                    sub={s.sub}
                    active={form.sous_type === s.value}
                    onClick={() => set('sous_type', form.sous_type === s.value ? '' : s.value)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ Étape 2 — Transaction ══ */}
      {step === 2 && (
        <div className="immo-card" style={{ padding: '1.5rem' }}>
          <p className="pb-section-head">Type de transaction</p>
          {errors.transaction && <div className="pb-err" style={{ marginBottom: '0.75rem' }}>{errors.transaction}</div>}
          <div className="pb-trans-row">
            <button
              type="button"
              className={`pb-trans-btn${form.transaction === 'location' ? ' pb-trans-active' : ''}`}
              onClick={() => set('transaction', 'location')}
            >
              <div className="pb-trans-title">Location</div>
              <div className="pb-trans-sub">Mise en location mensuelle avec loyer</div>
            </button>
            <button
              type="button"
              className={`pb-trans-btn${form.transaction === 'vente' ? ' pb-trans-active' : ''}`}
              onClick={() => set('transaction', 'vente')}
            >
              <div className="pb-trans-title">Vente</div>
              <div className="pb-trans-sub">Cession définitive du bien à l'acheteur</div>
            </button>
          </div>
        </div>
      )}

      {/* ══ Étape 3 — Prix ══ */}
      {step === 3 && (
        <div className="immo-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <MoneyField
            label={isLocation ? 'Loyer mensuel *' : 'Prix de vente *'}
            value={form.prix}
            onChange={v => set('prix', v)}
            error={errors.prix}
          />
          <MoneyField
            label="Prix promotionnel (optionnel)"
            value={form.prix_promo}
            onChange={v => set('prix_promo', v)}
          />
          {isLocation && (
            <>
              <div className="pb-section-divider" />
              <p className="pb-section-head">Conditions financières</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <MoneyField label="Avance (mois)" value={form.avance_mois} onChange={v => set('avance_mois', v)} unit="mois" />
                <MoneyField label="Caution (mois)" value={form.caution_mois} onChange={v => set('caution_mois', v)} unit="mois" />
              </div>
              <MoneyField label="Frais de visite" value={form.frais_visite} onChange={v => set('frais_visite', v)} />
              <MoneyField label="Commission agence" value={form.commission_agence} onChange={v => set('commission_agence', v)} />
            </>
          )}
        </div>
      )}

      {/* ══ Étape 4 — Localisation ══ */}
      {step === 4 && (
        <div className="immo-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <FormField label="Adresse *" error={errors.adresse}>
            <input
              className="immo-form-input"
              value={form.adresse}
              onChange={e => set('adresse', e.target.value)}
              placeholder="Ex : Lot 42, Rue des Cocotiers"
            />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <FormField label="Ville *" error={errors.ville}>
              <input
                className="immo-form-input"
                value={form.ville}
                onChange={e => set('ville', e.target.value)}
                placeholder="Ex : Cotonou"
              />
            </FormField>
            <FormField label="Quartier">
              <input
                className="immo-form-input"
                value={form.quartier}
                onChange={e => set('quartier', e.target.value)}
                placeholder="Ex : Cadjèhoun"
              />
            </FormField>
          </div>
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

      {/* ══ Étape 5 — Détails ══ */}
      {step === 5 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Description + superficie */}
          <div className="immo-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <p className="pb-section-head">Description</p>
            <FormField label="Description du bien (optionnel)">
              <textarea
                className="immo-form-input"
                style={{ height: 'auto', resize: 'vertical', paddingTop: '0.625rem', paddingBottom: '0.625rem' }}
                rows={4}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Décrivez le bien, ses atouts, l'environnement, les points forts…"
              />
            </FormField>
            <MoneyField label="Superficie (optionnel)" value={form.superficie} onChange={v => set('superficie', v)} unit="m²" />
          </div>

          {/* Caractéristiques (hors terrain) */}
          {!isTerrain && (
            <div className="immo-card" style={{ padding: '1.5rem' }}>
              <p className="pb-section-head" style={{ marginBottom: '1rem' }}>Sanitaire & Finition</p>
              <div className="pb-choices" style={{ marginBottom: '1.25rem' }}>
                {SANITAIRE_OPTS.map(o => (
                  <ChoiceItem
                    key={o.value}
                    label={o.label}
                    sub={o.sub}
                    active={form.sanitaire === o.value}
                    onClick={() => set('sanitaire', form.sanitaire === o.value ? '' : o.value)}
                  />
                ))}
              </div>
              {form.sanitaire === 'autre' && (
                <div className="immo-form-field" style={{ marginBottom: '1rem' }}>
                  <label className="immo-form-label">Préciser le sanitaire</label>
                  <input
                    className="immo-form-input"
                    value={form.sanitaire_autre}
                    onChange={e => set('sanitaire_autre', e.target.value)}
                    placeholder="Décrivez le type de sanitaire"
                  />
                </div>
              )}

              <div className="pb-section-divider" />
              <p className="pb-section-head" style={{ margin: '1rem 0 1rem' }}>Finition</p>
              <div className="pb-choices" style={{ marginBottom: '1.25rem' }}>
                {FINITION_OPTS.map(o => (
                  <ChoiceItem
                    key={o.value}
                    label={o.label}
                    sub={o.sub}
                    active={form.finition === o.value}
                    onClick={() => set('finition', form.finition === o.value ? '' : o.value)}
                  />
                ))}
              </div>

              <div className="pb-section-divider" />
              <p className="pb-section-head" style={{ margin: '1rem 0 1rem' }}>Cuisine</p>
              <div className="pb-choices" style={{ marginBottom: '1rem' }}>
                {CUISINE_OPTS.map(o => (
                  <ChoiceItem
                    key={o.value}
                    label={o.label}
                    sub={o.sub}
                    active={form.type_cuisine === o.value}
                    onClick={() => set('type_cuisine', form.type_cuisine === o.value ? '' : o.value)}
                  />
                ))}
              </div>
              {form.type_cuisine === 'autre' && (
                <input
                  className="immo-form-input"
                  style={{ marginBottom: '1rem' }}
                  value={form.cuisine_autre}
                  onChange={e => set('cuisine_autre', e.target.value)}
                  placeholder="Précisez le type de cuisine"
                />
              )}

              <div className="pb-section-divider" />
              <p className="pb-section-head" style={{ margin: '1rem 0 0.5rem' }}>Équipements</p>
              <div className="pb-toggle-list">
                <div className="pb-toggle-row">
                  <div>
                    <div className="pb-toggle-row-label">Clôturé</div>
                    <div className="pb-toggle-row-desc">Propriété entourée d'une clôture</div>
                  </div>
                  <Toggle checked={form.cloture} onChange={v => set('cloture', v)} />
                </div>
                <div className="pb-toggle-row">
                  <div>
                    <div className="pb-toggle-row-label">Accès véhicule</div>
                    <div className="pb-toggle-row-desc">Entrée carrossable ou parking</div>
                  </div>
                  <Toggle checked={form.acces_vehicule} onChange={v => set('acces_vehicule', v)} />
                </div>
                <div className="pb-toggle-row">
                  <div>
                    <div className="pb-toggle-row-label">Boyerie</div>
                    <div className="pb-toggle-row-desc">Logement pour personnel de maison</div>
                  </div>
                  <Toggle checked={form.boyerie} onChange={v => set('boyerie', v)} />
                </div>
              </div>
            </div>
          )}

          {/* Caractéristiques terrain */}
          {isTerrain && (
            <div className="immo-card" style={{ padding: '1.5rem' }}>
              <p className="pb-section-head" style={{ marginBottom: '0.75rem' }}>Documents & Caractéristiques</p>

              <FormField label="Document disponible (optionnel)">
                <select
                  className="immo-form-input"
                  value={form.document_terrain}
                  onChange={e => set('document_terrain', e.target.value)}
                >
                  <option value="">— Choisir un document —</option>
                  {DOC_TERRAIN_OPTS.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </FormField>

              <div className="pb-toggle-list" style={{ marginTop: '1rem' }}>
                <div className="pb-toggle-row">
                  <div>
                    <div className="pb-toggle-row-label">Titre foncier disponible</div>
                    <div className="pb-toggle-row-desc">Propriété avec titre foncier établi</div>
                  </div>
                  <Toggle checked={form.titre_foncier} onChange={v => set('titre_foncier', v)} />
                </div>
                <div className="pb-toggle-row">
                  <div>
                    <div className="pb-toggle-row-label">Terrain clôturé</div>
                    <div className="pb-toggle-row-desc">Délimité par une clôture ou haie</div>
                  </div>
                  <Toggle checked={form.cloture} onChange={v => set('cloture', v)} />
                </div>
              </div>
            </div>
          )}

          {/* Récapitulatif */}
          <div className="immo-card" style={{ padding: '1.5rem' }}>
            <p className="pb-section-head" style={{ marginBottom: '1rem' }}>Récapitulatif</p>
            <div className="pb-recap-block">
              {recapRows.map((r, i) => (
                <div key={i} className="pb-recap-row">
                  <span className="pb-recap-key">{r.k}</span>
                  <span className="pb-recap-val">{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="pb-nav">
        {step > 1 ? (
          <button type="button" className="pb-nav-back" onClick={back}>
            <ArrowLeft /> Précédent
          </button>
        ) : (
          <div />
        )}

        {step < STEPS.length ? (
          <button type="button" className="pb-nav-next" onClick={next}>
            Suivant <ArrowRight />
          </button>
        ) : (
          <button
            type="button"
            className="pb-nav-next"
            style={{ minWidth: 200 }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Publication en cours…' : 'Publier l\'annonce'}
          </button>
        )}
      </div>

    </div>
  );
}
