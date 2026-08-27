import axios from 'axios';
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export const getMessages = {
  conversations: (params?: any) =>
    axios.get(`${BASE}/admin/conversations`, { ...auth(), params }).then(r => r.data),
  thread: (id: number, params?: any) =>
    axios.get(`${BASE}/admin/conversations/${id}/messages`, { ...auth(), params }).then(r => r.data),
  // Supervision : toutes les conversations avec leur unread_count
  supervision: (params?: any) =>
    axios.get(`${BASE}/admin/conversations`, { ...auth(), params: { limit: 200, ...params } }).then(r => {
      const raw = r.data;
      const data: any[] = raw.data ?? raw;
      const total_unread = data.reduce((s: number, c: any) => s + (c.unread_count ?? 0), 0);
      return { data, total: raw.total ?? data.length, total_unread };
    }),
};
