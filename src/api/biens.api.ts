import api from './axios';
import type { Bien, StatutBien, TypeBien, TypeTransaction } from '../types';

export interface BiensFilters {
  page?: number;
  limit?: number;
  type?: TypeBien;
  transaction?: TypeTransaction;
  statut?: StatutBien;
  user_id?: number;
}

export const biensApi = {
  getAll: (params?: BiensFilters) =>
    api.get<Bien[]>('/biens', { params }).then((r) => r.data),

  getById: (id: number) =>
    api.get<Bien>(`/biens/${id}`).then((r) => r.data),

  // PATCH /biens/:id/statut — route correcte (corps : { statut })
  updateStatut: (id: number, statut: StatutBien) =>
    api.patch<Bien>(`/biens/${id}/statut`, { statut }).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/biens/${id}`).then((r) => r.data),
};
