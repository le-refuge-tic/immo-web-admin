import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postBien } from '../../api/postBien';

/* ─── Données statiques ──────────────────────────────────────── */

const TYPES = [
  { value: 'maison',        label: 'Maison',                icon: '🏡' },
  { value: 'appart_vide',   label: 'Appartement vide',      icon: '🏢' },
  { value: 'appart_meuble', label: 'Appartement meublé',    icon: '🛋️' },
  { value: 'guesthouse',    label: 'Guesthouse',            icon: '🏨' },
  { value: 'terrain',       label: 'Terrain',               icon: '🌱' },
];

const SOUS_TYPES: Record<string, { value: string; label: string }[]> = {
  maison: [
    { value: 'chambre_salon',       label: 'Chambre Salon' },
    { value: 'entree_coucher',      label: 'Entrée Coucher' },
    { value: 'villa',               label: 'Villa' },
    { value: 'maison_individuelle', label: 'Maison individuelle' },
    { value: 'villa_maison',        label: 'Villa / Maison' },
  ],
  appart_vide: [
    { value: 'appartement',         label: 'Appartement' },
    { value: 'villa',               label: 'Villa' },
    { value: 'maison_individuelle', label: 'Maison individuelle' },
  ],
  appart_meuble: [
    { value: 'appartement',         label: 'Appartement meublé' },
    { value: 'villa',               label: 'Villa meublée' },
    { value: 'guesthouse',          label: 'Guesthouse' },
  ],
  guesthouse: [],
  terrain: [],
};

const TRANSACTIONS = [
  { value: 'location', label: 'Location' },
  { value: 'vente',    label: 'Vente' },
];

const FINITIONS = ['économique', 'standard', 'moyen standing', 'haut standing'];
const CUISINES  = ['externe', 'intégrée', 'américaine', 'sans cuisine'];
const DOCUMENTS_TERRAIN = ['ACD', 'PV de bornage', 'Titre foncier', 'Certificat de coutume', 'Autre'];

const STEPS = [
  { id: 1, label: 'Classification' },
  { id: 2, label: 'Prix'           },
  { id: 3, label: 'Localisation'   },
  { id: 4, label: 'Détails'        },
];

/* ─── Types form ─────────────────────────────────────────────── */

type Form = {
  type: string;
  sous_type: string;
  transaction: string;
  prix: string;
  prix_promo: string;
  frais_visite: string;
  avance_mois: string;
  caution_mois: string;
  commission_agence: string;
  adresse: string;
  ville: string;
  quartier: string;
  latitude: string;
  longitude: string;
  description: string;
  superficie: string;
  cloture: boolean;
  titre_foncier: boolean;
  document_terrain: string;
  sanitaire: boolean;
  finition: string;
  type_cuisine: string;
};

const INITIAL: Form = {
  type: '', sous_type: '', transaction: '',
  prix: '', prix_promo: '', frais_visite: '',
  avance_mois: '', caution_mois: '', commission_agence: '',
  adresse: '', ville: '', quartier: '',
  latitude: '6.3654', longitude: '2.4183',
  description: '',
  superficie: '', cloture: false, titre_foncier: false, document_terrain: '',
  sanitaire: true, finition: '', type_cuisine: '',
};

/* ─── Helpers UI ─────────────────────────────────────────────── */

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text)', opacity: 0.75 }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: 11, color: 'var(--c-muted)' }}>{hint}</span>}
    </div>
  );
}

function Input({ value, onChange, type = 'text', placeholder = '', min }: {
  value: string; onChange: (v: string) => void; type?: string; placeholder?: string; min?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      style={{
        border: '1.5px solid var(--c-border)', borderRadius: 8,
        padding: '9px 12px', fontSize: 13, background: 'var(--c-input)',
        color: 'var(--c-text)', outline: 'none',
      }}
    />
  );
}

function Select({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        border: '1.5px solid var(--c-border)', borderRadius: 8,
        padding: '9px 12px', fontSize: 13, background: 'var(--c-input)',
        color: 'var(--c-text)', outline: 'none',
      }}
    >
      {children}
    </select>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 40, height: 22, borderRadius: 11,
          background: checked ? 'var(--c-primary)' : 'var(--c-border)',
          position: 'relative', transition: 'background .2s', flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: checked ? 20 : 3,
          width: 16, height: 16, borderRadius: '50%',
          background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        }} />
      </div>
      <span style={{ fontSize: 13, color: 'var(--c-text)' }}>{label}</span>
    </label>
  );
}

function NumField({ label, value, onChange, unit, hint }: {
  label: string; value: string; onChange: (v: string) => void; unit?: string; hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <div style={{ display: 'flex', gap: 0 }}>
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          min="0"
          style={{
            border: '1.5px solid var(--c-border)', borderTopLeftRadius: 8, borderBottomLeftRadius: 8,
            borderRight: unit ? 'none' : undefined, padding: '9px 12px',
            fontSize: 13, background: 'var(--c-input)', color: 'var(--c-text)', outline: 'none', flex: 1,
          }}
        />
        {unit && (
          <span style={{
            border: '1.5px solid var(--c-border)', borderTopRightRadius: 8, borderBottomRightRadius: 8,
            padding: '9px 12px', fontSize: 12, background: 'var(--c-bg)',
            color: 'var(--c-muted)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center',
          }}>{unit}</span>
        )}
      </div>
    </Field>
  );
}

/* ─── Indicateur de progression ─────────────────────────────── */

function StepBar({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }}>
      {STEPS.map((s, i) => {
        const done    = s.id < current;
        const active  = s.id === current;
        const color   = done || active ? 'var(--c-primary)' : 'var(--c-border)';
        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 1 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: done ? 'var(--c-primary)' : active ? 'var(--c-primary)' : 'var(--c-bg)',
                border: `2px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13, color: done || active ? '#fff' : 'var(--c-muted)',
              }}>
                {done ? '✓' : s.id}
              </div>
              <span style={{
                fontSize: 11, fontWeight: active ? 700 : 500,
                color: active ? 'var(--c-primary)' : done ? 'var(--c-text)' : 'var(--c-muted)',
                whiteSpace: 'nowrap',
              }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 2, marginTop: -20, marginLeft: 4, marginRight: 4,
                background: done ? 'var(--c-primary)' : 'var(--c-border)', borderRadius: 1,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Page principale ───────────────────────────────────────── */

export default function PublierBienPage() {
  const navigate = useNavigate();
  const [step, setStep]       = useState(1);
  const [form, setForm]       = useState<Form>(INITIAL);
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof Form, val: any) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  /* ── Validation par étape ── */
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!form.type)        errs.type        = 'Sélectionnez un type de bien';
      if (!form.transaction) errs.transaction = 'Sélectionnez un type de transaction';
    }
    if (step === 2) {
      if (!form.prix || Number(form.prix) <= 0) errs.prix = 'Prix obligatoire';
    }
    if (step === 3) {
      if (!form.adresse.trim()) errs.adresse = 'Adresse obligatoire';
      if (!form.ville.trim())   errs.ville   = 'Ville obligatoire';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  /* ── Construction du payload ── */
  const buildPayload = () => {
    const isTerrain = form.type === 'terrain';
    const isLocation = form.transaction === 'location';

    const amenites: any = {};
    if (form.sous_type) amenites.sous_type = form.sous_type;
    if (!isTerrain) {
      amenites.sanitaire   = form.sanitaire;
      if (form.finition)    amenites.finition = form.finition;
      if (form.type_cuisine) amenites.type_cuisine = form.type_cuisine;
      if (isLocation) {
        if (form.avance_mois)     amenites.avance_mois     = Number(form.avance_mois);
        if (form.caution_mois)    amenites.caution_mois    = Number(form.caution_mois);
        if (form.commission_agence) amenites.commission_agence = Number(form.commission_agence);
      }
    } else {
      if (form.document_terrain) amenites.document = form.document_terrain;
      amenites.titre_foncier = form.titre_foncier;
      amenites.cloture       = form.cloture;
    }

    const payload: any = {
      type:        form.type,
      transaction: form.transaction,
      prix:        Number(form.prix),
      localisation: {
        adresse:  form.adresse,
        ville:    form.ville,
        quartier: form.quartier || undefined,
        latitude:  Number(form.latitude)  || 6.3654,
        longitude: Number(form.longitude) || 2.4183,
      },
      amenites,
    };

    if (form.description)  payload.description = form.description;
    if (form.prix_promo)   payload.prix_promo  = Number(form.prix_promo);
    if (form.frais_visite) payload.frais_visite = Number(form.frais_visite);

    if (form.superficie) {
      const superficie = Number(form.superficie);
      if (isTerrain) {
        payload.details_terrain = { superficie, cloture: form.cloture };
      } else {
        payload.details_maison  = { superficie, cloture: form.cloture };
      }
    }

    return payload;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await postBien.create(buildPayload());
      navigate('/mes-annonces');
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Erreur lors de la publication.');
      setSubmitting(false);
    }
  };

  const isTerrain  = form.type === 'terrain';
  const isLocation = form.transaction === 'location';
  const sousList   = SOUS_TYPES[form.type] ?? [];

  /* ── Récapitulatif ── */
  const recapRows: { label: string; value: string }[] = [
    { label: 'Type',        value: TYPES.find(t => t.value === form.type)?.label ?? form.type },
    { label: 'Transaction', value: form.transaction === 'location' ? 'Location' : 'Vente' },
    ...(form.sous_type ? [{ label: 'Sous-type', value: sousList.find(s => s.value === form.sous_type)?.label ?? form.sous_type }] : []),
    { label: 'Prix',        value: `${Number(form.prix).toLocaleString('fr-FR')} FCFA` },
    ...(form.prix_promo ? [{ label: 'Prix promo', value: `${Number(form.prix_promo).toLocaleString('fr-FR')} FCFA` }] : []),
    { label: 'Adresse',    value: form.adresse },
    { label: 'Ville',      value: form.ville },
    ...(form.quartier ? [{ label: 'Quartier', value: form.quartier }] : []),
    ...(form.description ? [{ label: 'Description', value: form.description }] : []),
    ...(form.superficie ? [{ label: 'Superficie', value: `${form.superficie} m²` }] : []),
  ];

  return (
    <div className="immo-page" style={{ maxWidth: 640, margin: '0 auto' }}>

      {/* En-tête */}
      <div className="immo-page-header" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="immo-page-title">Publier un bien</h1>
          <p className="immo-page-sub">Renseignez les informations de votre annonce</p>
        </div>
        <button className="btn-ghost" onClick={() => navigate('/mes-annonces')}>Annuler</button>
      </div>

      {/* Barre de progression */}
      <StepBar current={step} />

      {/* ── Étape 1 : Classification ── */}
      {step === 1 && (
        <div className="immo-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text)', opacity: 0.75, display: 'block', marginBottom: 12 }}>
              Type de bien
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => { set('type', t.value); set('sous_type', ''); }}
                  style={{
                    border: `2px solid ${form.type === t.value ? 'var(--c-primary)' : 'var(--c-border)'}`,
                    borderRadius: 10, padding: '14px 8px',
                    background: form.type === t.value ? 'color-mix(in srgb, var(--c-primary) 10%, transparent)' : 'var(--c-card)',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 6,
                    color: form.type === t.value ? 'var(--c-primary)' : 'var(--c-text)',
                    fontWeight: form.type === t.value ? 700 : 500, fontSize: 12,
                    transition: 'all .15s',
                  }}
                >
                  <span style={{ fontSize: 22 }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
            {errors.type && <div style={{ fontSize: 12, color: '#DC2626', marginTop: 6 }}>{errors.type}</div>}
          </div>

          {sousList.length > 0 && (
            <Field label="Sous-type (optionnel)">
              <Select value={form.sous_type} onChange={v => set('sous_type', v)}>
                <option value="">— Non précisé —</option>
                {sousList.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </Field>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text)', opacity: 0.75, display: 'block', marginBottom: 12 }}>
              Type de transaction
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {TRANSACTIONS.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set('transaction', t.value)}
                  style={{
                    border: `2px solid ${form.transaction === t.value ? 'var(--c-primary)' : 'var(--c-border)'}`,
                    borderRadius: 10, padding: '14px 8px',
                    background: form.transaction === t.value ? 'color-mix(in srgb, var(--c-primary) 10%, transparent)' : 'var(--c-card)',
                    cursor: 'pointer', fontWeight: form.transaction === t.value ? 700 : 500,
                    fontSize: 13, color: form.transaction === t.value ? 'var(--c-primary)' : 'var(--c-text)',
                    transition: 'all .15s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {errors.transaction && <div style={{ fontSize: 12, color: '#DC2626', marginTop: 6 }}>{errors.transaction}</div>}
          </div>
        </div>
      )}

      {/* ── Étape 2 : Prix ── */}
      {step === 2 && (
        <div className="immo-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <NumField
            label={isLocation ? 'Loyer mensuel *' : 'Prix de vente *'}
            value={form.prix}
            onChange={v => set('prix', v)}
            unit="FCFA"
            hint={errors.prix}
          />
          <NumField
            label="Prix promotionnel (optionnel)"
            value={form.prix_promo}
            onChange={v => set('prix_promo', v)}
            unit="FCFA"
            hint="Doit être inférieur au prix principal"
          />
          {isLocation && (
            <>
              <NumField label="Frais de visite (optionnel)" value={form.frais_visite} onChange={v => set('frais_visite', v)} unit="FCFA" />
              <NumField label="Avance (mois)" value={form.avance_mois} onChange={v => set('avance_mois', v)} unit="mois" />
              <NumField label="Caution (mois)" value={form.caution_mois} onChange={v => set('caution_mois', v)} unit="mois" />
              <NumField label="Commission agence (optionnel)" value={form.commission_agence} onChange={v => set('commission_agence', v)} unit="FCFA" />
            </>
          )}
        </div>
      )}

      {/* ── Étape 3 : Localisation ── */}
      {step === 3 && (
        <div className="immo-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Field label="Adresse *">
            <Input value={form.adresse} onChange={v => set('adresse', v)} placeholder="Ex : Lot 42, Rue des Cocotiers" />
            {errors.adresse && <span style={{ fontSize: 12, color: '#DC2626' }}>{errors.adresse}</span>}
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Ville *">
              <Input value={form.ville} onChange={v => set('ville', v)} placeholder="Ex : Cotonou" />
              {errors.ville && <span style={{ fontSize: 12, color: '#DC2626' }}>{errors.ville}</span>}
            </Field>
            <Field label="Quartier">
              <Input value={form.quartier} onChange={v => set('quartier', v)} placeholder="Ex : Cadjèhoun" />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Latitude" hint="Par défaut : Cotonou">
              <Input value={form.latitude} onChange={v => set('latitude', v)} type="number" placeholder="6.3654" />
            </Field>
            <Field label="Longitude">
              <Input value={form.longitude} onChange={v => set('longitude', v)} type="number" placeholder="2.4183" />
            </Field>
          </div>
        </div>
      )}

      {/* ── Étape 4 : Détails & Récapitulatif ── */}
      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Détails */}
          <div className="immo-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Informations complémentaires</div>

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={4}
                placeholder="Décrivez le bien, ses atouts, l'environnement…"
                style={{
                  border: '1.5px solid var(--c-border)', borderRadius: 8,
                  padding: '9px 12px', fontSize: 13, background: 'var(--c-input)',
                  color: 'var(--c-text)', outline: 'none', resize: 'vertical',
                }}
              />
            </Field>

            <NumField label="Superficie (optionnel)" value={form.superficie} onChange={v => set('superficie', v)} unit="m²" />

            {!isTerrain && (
              <>
                <Toggle checked={form.sanitaire} onChange={v => set('sanitaire', v)} label="Sanitaire inclus" />
                <Toggle checked={form.cloture}   onChange={v => set('cloture', v)}   label="Clôturé" />
                <Field label="Finition (optionnel)">
                  <Select value={form.finition} onChange={v => set('finition', v)}>
                    <option value="">— Choisir —</option>
                    {FINITIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </Select>
                </Field>
                <Field label="Type de cuisine (optionnel)">
                  <Select value={form.type_cuisine} onChange={v => set('type_cuisine', v)}>
                    <option value="">— Choisir —</option>
                    {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </Field>
              </>
            )}

            {isTerrain && (
              <>
                <Toggle checked={form.cloture}        onChange={v => set('cloture', v)}        label="Terrain clôturé" />
                <Toggle checked={form.titre_foncier}  onChange={v => set('titre_foncier', v)}  label="Titre foncier disponible" />
                <Field label="Document disponible (optionnel)">
                  <Select value={form.document_terrain} onChange={v => set('document_terrain', v)}>
                    <option value="">— Choisir —</option>
                    {DOCUMENTS_TERRAIN.map(d => <option key={d} value={d}>{d}</option>)}
                  </Select>
                </Field>
              </>
            )}
          </div>

          {/* Récapitulatif */}
          <div className="immo-card" style={{ padding: 28 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Récapitulatif</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {recapRows.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '9px 0',
                  borderBottom: i < recapRows.length - 1 ? '1px solid var(--c-border)' : 'none',
                  fontSize: 13,
                }}>
                  <span style={{ color: 'var(--c-muted)', fontWeight: 500 }}>{r.label}</span>
                  <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, gap: 12 }}>
        {step > 1 ? (
          <button className="btn-ghost" onClick={back} style={{ minWidth: 110 }}>← Précédent</button>
        ) : (
          <div />
        )}
        {step < STEPS.length ? (
          <button className="btn-submit" onClick={next} style={{ minWidth: 130 }}>
            Suivant →
          </button>
        ) : (
          <button
            className="btn-submit"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ minWidth: 160 }}
          >
            {submitting ? 'Publication…' : 'Publier l\'annonce'}
          </button>
        )}
      </div>
    </div>
  );
}
