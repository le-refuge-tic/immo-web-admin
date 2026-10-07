import { createContext, useContext, useEffect, useState } from 'react';
import { getAuth } from '../api/getAuth';
import { postAuth } from '../api/postAuth';

const AuthContext = createContext(null as any);

export function AuthProvider({ children }: { children: any }) {
  const [user, setUser]         = useState(null as any);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { setLoading(false); return; }
    getAuth.profile()
      .then(setUser)
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
    setUser(profile);
  };

  // 2FA : /auth/login envoie un code SMS et renvoie { requires_otp, session_token } ;
  // les jetons ne sont délivrés qu'après /auth/otp/verify.
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
    try { await postAuth.logout(); } catch { /* ignore */ }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const refreshUser = async () => {
    const profile = await getAuth.profile(); // peut lever — l'appelant doit catcher
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
