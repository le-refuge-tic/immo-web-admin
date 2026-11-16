import { createContext, useContext, useEffect, useState } from 'react';
import { getAuth } from '../api/getAuth';
import { postAuth } from '../api/postAuth';
import { viderLots } from '../shared/uploads/stockageEnvoi';
import { preparerCompte } from '../shared/brouillons/synchroniser';
import { stockageEtatLocal, synchroniserAvantDeconnexion } from '../shared/brouillons/useSynchroBrouillons';
import { CLE_ETAT_SYNCHRO, magasinsAdministration } from '../pages/commercial/brouillons/brouillonsLocaux';

/**
 * Lot 6 — dès que le compte est connu : les brouillons d'un autre compte laissés sur ce
 * navigateur sont retirés avant tout affichage (ils sont sur le serveur, à lui).
 */
function rattacherBrouillons(profile: { id?: unknown } | null): void {
  if (typeof profile?.id === 'number') preparerCompte(profile.id, magasinsAdministration(), stockageEtatLocal(CLE_ETAT_SYNCHRO));
}

const AuthContext = createContext(null as any);

export function AuthProvider({ children }: { children: any }) {
  const [user, setUser]         = useState(null as any);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { setLoading(false); return; }
    getAuth.profile()
      .then(profile => { rattacherBrouillons(profile); setUser(profile); })
      .catch((err: any) => {
        // Ne supprimer le token que si le serveur confirme qu'il est invalide (401/403).
        // Une erreur réseau (Render endormi, timeout) ne doit pas déconnecter l'utilisateur.
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const storeSession = async (tokens: { access_token: string; refresh_token: string }) => {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    const profile = await getAuth.profile();
    rattacherBrouillons(profile);
    setUser(profile);
  };

  // 2FA : sur un nouvel appareil, puis au plus tous les 7 jours, /auth/login envoie
  // un code SMS et renvoie { requires_otp, session_token } ; les jetons ne sont
  // alors délivrés qu'après /auth/otp/verify. Sinon, ils arrivent directement.
  const login = async (payload: any) => {
    const res = await postAuth.login(payload);
    if (res?.requires_otp) return { requiresOtp: true, sessionToken: res.session_token };
    await storeSession(res);
    return { requiresOtp: false };
  };

  const verifyOtp = async (sessionToken: string, code: string) => {
    await storeSession(await postAuth.verifyOtp(sessionToken, code));
  };

  const logout = async () => {
    // Lot 6 : dernières saisies envoyées au serveur avant la sortie (au plus 3 s).
    await synchroniserAvantDeconnexion();
    try { await postAuth.logout(); } catch { /* ignore */ }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // Les photos en attente d'envoi ne restent pas sur l'appareil après la déconnexion.
    void viderLots();
    setUser(null);
  };

  const refreshUser = async () => {
    const profile = await getAuth.profile(); // peut lever — l'appelant doit catcher
    rattacherBrouillons(profile);
    setUser(profile);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, verifyOtp, logout, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
