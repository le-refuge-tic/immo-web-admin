import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export const patchAdminBien = {
  moderate: (id: number, payload: any) =>
    axios.patch(`${BASE}/admin/biens/${id}/moderation`, payload, auth()).then(r => r.data),
};
