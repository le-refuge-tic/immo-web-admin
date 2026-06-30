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
      .catch(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (payload: any) => {
    const tokens = await postAuth.login(payload);
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    const profile = await getAuth.profile();
    setUser(profile);
  };

  const logout = async () => {
    try { await postAuth.logout(); } catch { /* ignore */ }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const refreshUser = async () => {
    const profile = await getAuth.profile();
    setUser(profile);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
