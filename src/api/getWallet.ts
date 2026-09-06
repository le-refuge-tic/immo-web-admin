import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export type Wallet = {
  id: number;
  type: string;
  balance: number;
  currency: string;
};

export type WalletTransaction = {
  id: number;
  wallet_id: number;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  reference: string | null;
  description: string;
  status: string;
  metadata: Record<string, any> | null;
  initiated_by: number | null;
  created_at: string;
};

export const getWallet = {
  solde: (type: string): Promise<Wallet> => axios.get(`${BASE}/wallets/me/solde`, { ...auth(), params: { type } }).then(r => r.data),
  transactions: (type: string): Promise<WalletTransaction[]> => axios.get(`${BASE}/wallets/me/transactions`, { ...auth(), params: { type } }).then(r => r.data),
};
