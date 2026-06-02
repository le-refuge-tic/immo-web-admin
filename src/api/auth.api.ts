import api from './axios';
import type { AuthTokens, LoginPayload, User } from '../types';

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<AuthTokens>('/auth/login', payload).then((r) => r.data),

  logout: () =>
    api.post('/auth/logout').then((r) => r.data),

  refreshToken: (refresh_token: string) =>
    api.post<AuthTokens>('/auth/refresh', { refresh_token }).then((r) => r.data),

  getProfile: () =>
    api.get<User>('/users/me').then((r) => r.data),

  updateProfile: (data: { nom?: string; prenom?: string; email?: string; telephone?: string }) =>
    api.patch<User>('/users/me', data).then((r) => r.data),
};
