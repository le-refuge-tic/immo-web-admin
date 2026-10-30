import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

// Appareil de confiance : après un OTP réussi, le serveur renvoie un device_token
// (valable 7 jours pour les admins). On le renvoie à chaque connexion pour ne pas
// redemander l'OTP ; il survit à la déconnexion, c'est le serveur qui l'expire.
const DEVICE_KEY = 'admin_device_token';
const getDeviceToken = () => {
  try { return localStorage.getItem(DEVICE_KEY) || undefined; } catch { return undefined; }
};
/** Mémorise le device_token d'une réponse serveur, s'il y en a un. */
export const rememberDeviceToken = (data: { device_token?: unknown } | null | undefined) => {
  const jeton = data?.device_token;
  if (typeof jeton === 'string' && jeton) {
    try { localStorage.setItem(DEVICE_KEY, jeton); } catch { /* OTP redemandé */ }
  }
};

export const postAuth = {
  login:   (payload: any) =>
    axios.post(`${BASE}/auth/login`, { ...payload, device_token: getDeviceToken() }).then(r => r.data),
  verifyOtp: (session_token: string, code: string) =>
    axios.post(`${BASE}/auth/otp/verify`, { session_token, code }).then(r => {
      rememberDeviceToken(r.data);
      return r.data;
    }),
  logout:  ()             => axios.post(`${BASE}/auth/logout`,  {}, { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }).then(r => r.data),
  refresh: (token: string) => axios.post(`${BASE}/auth/refresh`, { refresh_token: token }).then(r => r.data),
};
