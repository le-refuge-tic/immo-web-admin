import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export const getFeedback = {
  list: (params?: any) => axios.get(`${BASE}/admin/feedbacks`, { ...auth(), params }).then(r => r.data),
};
