import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export type GeocodeResult = { latitude: number; longitude: number; adresse_normalisee: string };
export type ReverseGeocodeResult = { adresse: string };

export const getGeocoding = {
  geocoder: (adresse: string): Promise<GeocodeResult> =>
    axios.get(`${BASE}/geocoding`, { ...auth(), params: { adresse } }).then(r => r.data),
  reverse: (lat: number, lng: number): Promise<ReverseGeocodeResult> =>
    axios.get(`${BASE}/geocoding/reverse`, { ...auth(), params: { lat, lng } }).then(r => r.data),
};
