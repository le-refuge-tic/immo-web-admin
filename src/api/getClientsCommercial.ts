import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export const commerciauxApi = {
  getClients:      (commercialId: number) =>
    axios.get(`${BASE}/admin/commerciaux/${commercialId}/clients`, auth()).then(r => r.data),
  attribuerClient: (commercialId: number, userId: number) =>
    axios.post(`${BASE}/admin/commerciaux/${commercialId}/attribuer-client`, { user_id: userId }, auth()).then(r => r.data),
};
