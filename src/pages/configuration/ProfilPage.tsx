import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProfilEditModal from './ProfilEditModal';
import ProfilInfoCard from './ProfilInfoCard';

const ROLE_LABELS: any = {
  super_admin:  'Super Administrateur',
  admin:        'Administrateur',
  proprietaire: 'Propriétaire',
  demarcheur:   'Démarcheur',
  locataire:    'Locataire',
  prospect:     'Prospect',
  detenteur:    'Propriétaire (dépr.)',
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

export default function ProfilPage() {
  const { user, refreshUser } = useAuth();
  const [showEdit, setShowEdit] = useState(false);

  if (!user) return null;

  const initials    = `${user.nom[0] ?? ''}${user.prenom[0] ?? ''}`.toUpperCase();
  const avatarColor = getAvatarColor(user.nom + user.prenom);
  const roleLabel   = ROLE_LABELS[user.role] ?? user.role;

  const editInitial = {
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
        <div className="profil-hero">
          <div className="profil-avatar-lg" style={{ background: avatarColor }}>
            {initials}
          </div>
          <div className="profil-hero-info">
            <div className="profil-hero-name">{user.prenom} {user.nom}</div>
            <div className="profil-hero-role">{roleLabel}</div>
            {user.email && <div className="profil-hero-email">{user.email}</div>}
            <button className="profil-edit-btn" onClick={() => setShowEdit(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Modifier le profil
            </button>
          </div>
        </div>

        <div className="profil-info-grid">
          <ProfilInfoCard label="Nom" value={user.nom} />
          <ProfilInfoCard label="Prénom" value={user.prenom} />
          <ProfilInfoCard label="Email" value={user.email ?? '—'} muted={!user.email} />
          <ProfilInfoCard label="Téléphone" value={user.telephone ?? '—'} muted={!user.telephone} />
          <ProfilInfoCard label="Membre depuis" value={formatDate(user.created_at)} />
          <ProfilInfoCard label="Statut du compte" value={user.actif ? 'Compte actif' : 'Compte désactivé'} />
        </div>

        <div className="immo-card" style={{ padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', marginBottom: 3 }}>Sécurité du compte</div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)', lineHeight: 1.5 }}>
              Pour modifier votre mot de passe, contactez un autre super administrateur ou utilisez la procédure de réinitialisation par email.
            </div>
          </div>
        </div>
      </div>

      {showEdit && (
        <ProfilEditModal
          initial={editInitial}
          onClose={() => setShowEdit(false)}
          onSaved={async () => { await refreshUser(); }}
        />
      )}
    </>
  );
}
