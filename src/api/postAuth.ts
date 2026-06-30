import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export const postAuth = {
  login:   (payload: any) => axios.post(`${BASE}/auth/login`,   payload).then(r => r.data),
  logout:  ()             => axios.post(`${BASE}/auth/logout`,  {}, { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }).then(r => r.data),
  refresh: (token: string) => axios.post(`${BASE}/auth/refresh`, { refresh_token: token }).then(r => r.data),
};
