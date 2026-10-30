import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

let refreshing: Promise<string | null> | null = null;

/**
 * Renouvelle le jeton d'accès (15 min) avec le refresh token (7 jours,
 * renouvelé à chaque usage). Sans cela, l'admin était déconnecté au bout de
 * 15 minutes et devait refaire mot de passe + OTP.
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(`${BASE}/auth/refresh`, { refresh_token: refreshToken });
    localStorage.setItem('access_token', data.access_token);
    if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
    return data.access_token as string;
  } catch {
    // Un autre onglet a pu rafraîchir juste avant avec ce même refresh token
    // (usage unique) : on reprend alors ses jetons au lieu de déconnecter.
    const actuel = localStorage.getItem('refresh_token');
    if (actuel && actuel !== refreshToken) return localStorage.getItem('access_token');
    return null;
  }
}

function forceLogout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  if (location.pathname !== '/login') location.href = '/login';
}

/**
 * Sur un 401 (hors routes /auth/), rafraîchit une seule fois — même si
 * plusieurs requêtes échouent en même temps — puis rejoue la requête.
 */
axios.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    // Les routes /auth/ renvoient aussi 401 pour une erreur métier (mot de
    // passe ou code faux) : on ne rafraîchit que sur l'expiration du jeton,
    // que le garde JWT signale par le message générique « Unauthorized ».
    const isAuthRoute = typeof original?.url === 'string' && original.url.includes('/auth/');
    const jetonExpire = error.response?.data?.message === 'Unauthorized';
    if (error.response?.status === 401 && original && !original._retry && (!isAuthRoute || jetonExpire)) {
      original._retry = true;
      if (!refreshing) refreshing = refreshAccessToken().finally(() => { refreshing = null; });
      const newToken = await refreshing;
      if (newToken) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return axios(original);
      }
      forceLogout();
    }
    return Promise.reject(error);
  },
);
