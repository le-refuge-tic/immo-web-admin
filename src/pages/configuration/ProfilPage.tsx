import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth.api';

const ROLE_LABELS: Record<string, string> = {
  super_admin:  'Super Administrateur',
  admin:        'Administrateur',
  proprietaire: 'Propriétaire',
  demarcheur:   'Démarcheur',
  locataire:    'Locataire',
  prospect:     'Prospect',
  detenteur:    'Propriétaire (dépr.)', // rétrocompat
};

const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#D97706', '#16A34A'];

function getAvatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ── Edit modal ───────────────────────────────────────────────────────────────

interface EditForm {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
}

function EditModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: EditForm;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState<EditForm>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof EditForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.updateProfile({
        nom: form.nom,
        prenom: form.prenom,
        email: form.email || undefined,
        telephone: form.telephone || undefined,
      });
      await onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="immo-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="immo-modal">
        <div className="immo-modal-title">Modifier mon profil</div>
        <div className="immo-modal-sub">Les modifications seront appliquées immédiatement.</div>

        {error && (
          <div style={{
            background: 'var(--c-red-bg)', color: 'var(--c-red)',
            border: '1px solid #FECACA', borderRadius: 8,
            padding: '9px 13px', fontSize: 12, fontWeight: 500, marginBottom: 14,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="immo-form-field">
              <label className="immo-form-label">Nom</label>
              <input className="immo-form-input" value={form.nom} onChange={set('nom')} required placeholder="Hounssou" />
            </div>
            <div className="immo-form-field">
              <label className="immo-form-label">Prénom</label>
              <input className="immo-form-input" value={form.prenom} onChange={set('prenom')} required placeholder="Franck" />
            </div>
          </div>
          <div className="immo-form-field">
            <label className="immo-form-label">Adresse email</label>
            <input className="immo-form-input" type="email" value={form.email} onChange={set('email')} placeholder="admin@houetche.com" />
          </div>
          <div className="immo-form-field">
            <label className="immo-form-label">Téléphone</label>
            <input className="immo-form-input" type="tel" value={form.telephone} onChange={set('telephone')} placeholder="+229 01 XX XX XX XX" />
          </div>

          <div className="immo-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                  Enregistrement…
                </>
              ) : 'Enregistrer'}
            </button>
          </div>
        </form>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ── Info card ────────────────────────────────────────────────────────────────

function InfoCard({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="profil-info-card">
      <div className="profil-info-label">{label}</div>
      <div className={`profil-info-value${muted ? ' muted' : ''}`}>{value}</div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilPage() {
  const { user, refreshUser } = useAuth();
  const [showEdit, setShowEdit] = useState(false);

  if (!user) return null;

  const initials = `${user.nom[0] ?? ''}${user.prenom[0] ?? ''}`.toUpperCase();
  const avatarColor = getAvatarColor(user.nom + user.prenom);
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;

  const handleSaved = async () => {
    await refreshUser();
  };

  const editInitial: EditForm = {
    nom:       user.nom,
    prenom:    user.prenom,
    email:     user.email ?? '',
    telephone: user.telephone ?? '',
  };

  return (
    <>
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Mon profil</h1>
          <p>Vos informations personnelles et paramètres de compte</p>
        </div>
      </div>

      <div className="immo-page">
        {/* Hero card */}
        <div className="profil-hero">
          <div className="profil-avatar-lg" style={{ background: avatarColor }}>
            {initials}
          </div>
          <div className="profil-hero-info">
            <div className="profil-hero-name">{user.prenom} {user.nom}</div>
            <div className="profil-hero-role">{roleLabel}</div>
            {user.email && (
              <div className="profil-hero-email">{user.email}</div>
            )}
            <button className="profil-edit-btn" onClick={() => setShowEdit(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Modifier le profil
            </button>
          </div>
        </div>

        {/* Info grid */}
        <div className="profil-info-grid">
          <InfoCard label="Nom" value={user.nom} />
          <InfoCard label="Prénom" value={user.prenom} />
          <InfoCard label="Email" value={user.email ?? '—'} muted={!user.email} />
          <InfoCard label="Téléphone" value={user.telephone ?? '—'} muted={!user.telephone} />
          <InfoCard label="Membre depuis" value={formatDate(user.created_at)} />
          <InfoCard
            label="Statut du compte"
            value={user.actif ? 'Compte actif' : 'Compte désactivé'}
          />
        </div>

        {/* Security note */}
        <div className="immo-card" style={{ padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', marginBottom: 3 }}>
              Sécurité du compte
            </div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)', lineHeight: 1.5 }}>
              Pour modifier votre mot de passe, contactez un autre super administrateur ou utilisez la procédure de réinitialisation par email.
            </div>
          </div>
        </div>
      </div>

      {showEdit && (
        <EditModal
          initial={editInitial}
          onClose={() => setShowEdit(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
