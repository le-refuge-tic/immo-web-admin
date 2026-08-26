import axios from 'axios';
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export const postBien = {
  create: (dto: any) => axios.post(`${BASE}/biens`, dto, auth()).then(r => r.data),
  delete: (id: number) => axios.delete(`${BASE}/biens/${id}`, auth()).then(r => r.data),
  uploadPhoto: (id: number, file: File) => {
    const fd = new FormData();
    fd.append('photo', file);
    return axios.post(`${BASE}/biens/${id}/photos`, fd, auth()).then(r => r.data);
  },
  uploadVideo: (id: number, file: File) => {
    const fd = new FormData();
    fd.append('video', file);
    return axios.post(`${BASE}/biens/${id}/video`, fd, auth()).then(r => r.data);
  },
};
