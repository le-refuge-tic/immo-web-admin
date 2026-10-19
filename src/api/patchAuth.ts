import axios from 'axios';
import { rememberDeviceToken } from './postAuth';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export const patchAuth = {
  profile:          (data: any) => axios.patch(`${BASE}/users/me`, data, auth()).then(r => r.data),
  // `mot_de_passe_actuel` est exigé par l'API dès que le compte a déjà un
  // numéro : le téléphone sert au 2FA et à la réinitialisation du mot de passe.
  sendPhoneOtp:     (telephone: string, mot_de_passe_actuel?: string) =>
    axios.post(`${BASE}/auth/phone/send-otp`, { telephone, mot_de_passe_actuel }, auth())
      .then(r => r.data as { session_token: string }),
  // L'appareil qui valide le numéro devient de confiance : c'est notamment
  // le cas à la toute première connexion d'un commercial (enrôlement).
  verifyPhoneOtp:   (session_token: string, code: string, telephone: string) =>
    axios.post(`${BASE}/auth/phone/verify`, { session_token, code, telephone }, auth()).then(r => {
      rememberDeviceToken(r.data);
      return r.data;
    }),
  // Changement de mot de passe, étape 1 : vérifie le mot de passe actuel et
  // envoie un code SMS (requires_otp: false pour le mot de passe provisoire).
  sendPasswordOtp:  (current_password: string) =>
    axios.post(`${BASE}/auth/password/send-otp`, { current_password }, auth())
      .then(r => r.data as { requires_otp: boolean; session_token?: string }),
  // Étape 2 : le serveur ferme les autres sessions et renvoie de nouveaux
  // jetons pour cet appareil, enregistrés aussitôt.
  changePassword:   (body: { current_password: string; new_password: string; session_token?: string; code?: string }) =>
    axios.post(`${BASE}/auth/password/change`, body, auth()).then(r => {
      if (r.data?.access_token) localStorage.setItem('access_token', r.data.access_token);
      if (r.data?.refresh_token) localStorage.setItem('refresh_token', r.data.refresh_token);
      rememberDeviceToken(r.data);
      return r.data;
    }),
};
