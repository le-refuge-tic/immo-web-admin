import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export const getAdminBien = {
  list:  (params?: any) => axios.get(`${BASE}/admin/biens`, { ...auth(), params }).then(r => r.data),
  byId:  (id: number)   => axios.get(`${BASE}/admin/biens/${id}`, auth()).then(r => r.data),
};
