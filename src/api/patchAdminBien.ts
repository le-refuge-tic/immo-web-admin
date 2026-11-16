import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export const patchAdminBien = {
  moderate: (id: number, payload: any) =>
    axios.patch(`${BASE}/admin/biens/${id}/moderation`, payload, auth()).then(r => r.data),

  update: (id: number, payload: any) =>
    axios.patch(`${BASE}/admin/biens/${id}`, payload, auth()).then(r => r.data),

  /** Lot 5 — conversion explicite (type changé par un admin), données incompatibles nettoyées. */
  convertir: (id: number, payload: any) =>
    axios.post(`${BASE}/admin/biens/${id}/convertir`, payload, auth()).then(r => r.data),

  /** Lot 5 — décision sur la modification en attente d'un bien approuvé. */
  deciderModification: (id: number, payload: { decision: 'approuver' | 'rejeter'; motif?: string }) =>
    axios.patch(`${BASE}/admin/biens/${id}/modification`, payload, auth()).then(r => r.data),
};
