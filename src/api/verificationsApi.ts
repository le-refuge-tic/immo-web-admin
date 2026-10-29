import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export const verificationsApi = {
  list: () => axios.get(`${BASE}/admin/verifications`, auth()).then(r => r.data),

  valider: (userId: number) =>
    axios.patch(`${BASE}/admin/verifications/${userId}/valider`, {}, auth()).then(r => r.data),

  rejeter: (userId: number, motif: string) =>
    axios.patch(`${BASE}/admin/verifications/${userId}/rejeter`, { motif }, auth()).then(r => r.data),
};
