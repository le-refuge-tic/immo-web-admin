import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export const adminPhotos = {
  upload: (bienId: number, file: File, pieceId?: number) => {
    const fd = new FormData();
    fd.append('photo', file);
    const params = pieceId ? `?piece_id=${pieceId}` : '';
    return axios.post<{ id: number; url: string; is_cover: boolean; piece_id: number | null }>(
      `${BASE}/admin/biens/${bienId}/photos${params}`,
      fd,
      { headers: { ...auth().headers, 'Content-Type': 'multipart/form-data' } },
    ).then(r => r.data);
  },

  remove: (bienId: number, photoId: number) =>
    axios.delete(`${BASE}/admin/biens/${bienId}/photos/${photoId}`, auth()).then(r => r.data),

  setCover: (bienId: number, photoId: number) =>
    axios.patch(`${BASE}/admin/biens/${bienId}/photos/${photoId}/cover`, {}, auth()).then(r => r.data),
};

/** Vidéo d'annonce côté staff : MP4, 30 Mo au plus ; remplace la précédente. */
export const adminVideo = {
  upload: (bienId: number, file: File) => {
    const fd = new FormData();
    fd.append('video', file);
    return axios.post<{ video_url: string }>(`${BASE}/admin/biens/${bienId}/video`, fd, auth()).then(r => r.data);
  },

  remove: (bienId: number) =>
    axios.delete<{ video_url: null }>(`${BASE}/admin/biens/${bienId}/video`, auth()).then(r => r.data),
};
