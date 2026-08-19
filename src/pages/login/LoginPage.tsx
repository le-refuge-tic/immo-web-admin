import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import villaImg       from '../../assets/login/villa.jpg';
import appartementImg from '../../assets/login/appartement.jpg';
import terrainImg     from '../../assets/login/terrain.jpg';
import logoUrl        from '../../assets/logo_complet.jpeg';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  if (isAuthenticated) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(msg || 'Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-root">

      {/* ════════════════  PANNEAU GAUCHE  ════════════════ */}
      <div className="lp-left">

        {/* Logo / marque */}
        <div className="lp-brand">
          <img src={logoUrl} alt="REFUGE" style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 16 }} />
          <span className="lp-brand-name">REFUGE</span>
        </div>

        {/* ── Collage de propriétés superposées ── */}
        <div className="lp-collage">
          <div className="lp-img lp-img--1">
            <img src={terrainImg} alt="Terrain"/>
          </div>
          <div className="lp-img lp-img--2">
            <img src={appartementImg} alt="Appartement"/>
          </div>
          <div className="lp-img lp-img--3">
            <img src={villaImg} alt="Villa"/>
          </div>
        </div>

        {/* Accroche */}
        <div className="lp-tagline">
          Trouvez la propriété<br/>
          <span>que vous aimez.</span>
        </div>
      </div>

      {/* ════════════════  PANNEAU DROIT  ════════════════ */}
      <div className="lp-right">

        {/* Cercles décoratifs de fond */}
        <div className="lp-deco lp-deco--1"/>
        <div className="lp-deco lp-deco--2"/>
        <div className="lp-deco lp-deco--3"/>

        <div className="lp-form-card">

          {/* Logo centré */}
          <div className="lp-form-logo">
            <img src={logoUrl} alt="REFUGE" style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 16 }} />
          </div>

          {/* Titre + sous-titre */}
          <h2 className="lp-form-title">Bienvenue</h2>
          <p className="lp-form-sub">
            Connectez-vous à votre espace administrateur
          </p>

          {/* Erreur */}
          {error && <div className="lp-error">{error}</div>}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="lp-form">

            <div className="lp-field">
              <label className="lp-label">Adresse e-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@refuge-immo.com"
                required
                autoFocus
                className="lp-input"
              />
            </div>

            <div className="lp-field">
              <div className="lp-label-row">
                <label className="lp-label">Mot de passe</label>
              </div>
              <div className="lp-pwd-wrap">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="lp-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="lp-eye-btn"
                  tabIndex={-1}
                >
                  {showPwd ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.8">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45
                        18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11
                        8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="lp-btn-submit">
              {loading ? (
                <><span className="lp-spinner"/>Connexion…</>
              ) : 'Se connecter'}
            </button>
          </form>

          {/* Footer */}
          <div className="lp-divider"/>
          <div className="lp-footer">
            REFUGE Immobilier · Interface administrateur
          </div>

        </div>
      </div>

      <style>{`@keyframes lp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
