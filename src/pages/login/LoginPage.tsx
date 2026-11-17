import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import villaImg       from '../../assets/login/villa.jpg';
import appartementImg from '../../assets/login/appartement.jpg';
import terrainImg     from '../../assets/login/terrain.jpg';
import logoUrl        from '../../assets/logo_complet.jpeg';
import { apiMessage } from '../../utils/apiMessage';
import { EmailInput, ErreurChamp } from '../../shared/saisie/champs';
import { idErreur, useValidation } from '../../shared/saisie/validation';
import { schemaCodeOtp, schemaConnexion } from '../../validation/schemas';

export default function LoginPage() {
  const { login, verifyOtp, isAuthenticated } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [code,     setCode]     = useState('');
  const vConnexion = useValidation('connexion', schemaConnexion, { email, password });
  const vOtp = useValidation('connexion-otp', schemaCodeOtp, { code });

  useEffect(() => {
    document.body.classList.add('lp-page');
    return () => { document.body.classList.remove('lp-page'); };
  }, []);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setError('');
    const envoyer = async (action: () => Promise<void>) => {
      setLoading(true);
      try {
        await action();
        // La redirection est gérée par <Navigate> quand isAuthenticated devient true
      } catch (err: any) {
        const msg = apiMessage(err);
        const fallback = sessionToken ? 'Code invalide ou expiré.' : 'Email ou mot de passe incorrect.';
        setError(msg || fallback);
      } finally {
        setLoading(false);
      }
    };
    if (sessionToken) void vOtp.soumettre(d => envoyer(() => verifyOtp(sessionToken, d.code)));
    else void vConnexion.soumettre(d => envoyer(async () => {
      const res = await login({ email: d.email, password: d.password });
      if (res.requiresOtp) setSessionToken(res.sessionToken);
    }));
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
          <form onSubmit={handleSubmit} className="lp-form" noValidate>

            {sessionToken ? (
            <div className="lp-field">
              <label className="lp-label">Code reçu par SMS</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                autoFocus
                className="lp-input"
                {...vOtp.propsChamp('code')}
              />
              <ErreurChamp id={idErreur('connexion-otp', 'code')} message={vOtp.erreurs.code} />
              <button
                type="button"
                onClick={() => { setSessionToken(''); setCode(''); setError(''); }}
                style={{ marginTop: 8, background: 'none', border: 'none', padding: 0, color: 'var(--s-blue)', fontSize: 13, cursor: 'pointer' }}
              >
                ← Modifier l'e-mail ou le mot de passe
              </button>
            </div>
            ) : (<>
            <div className="lp-field">
              <label className="lp-label">Adresse e-mail</label>
              <EmailInput
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@refuge-immo.com"
                autoFocus
                className="lp-input"
                {...vConnexion.propsChamp('email')}
              />
              <ErreurChamp id={idErreur('connexion', 'email')} message={vConnexion.erreurs.email} />
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
                  maxLength={128}
                  autoComplete="current-password"
                  className="lp-input"
                  {...vConnexion.propsChamp('password')}
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
              <ErreurChamp id={idErreur('connexion', 'password')} message={vConnexion.erreurs.password} />
            </div>
            </>)}

            <button type="submit" disabled={loading || (!!sessionToken && code.length !== 6)} className="lp-btn-submit">
              {loading ? (
                <><span className="lp-spinner"/>{sessionToken ? 'Vérification…' : 'Connexion…'}</>
              ) : (sessionToken ? 'Valider le code' : 'Se connecter')}
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
