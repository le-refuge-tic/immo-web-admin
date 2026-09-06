import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const COTONOU: [number, number] = [6.3654, 2.4183];

const MOD_LABEL: Record<string, string> = {
  en_attente: 'En attente', approuve: 'Publié', rejete: 'Rejeté', conditionnel: 'Conditionnel',
};

type BienPoint = {
  id: number;
  label: string;
  statut_moderation: string;
  latitude: number;
  longitude: number;
};

/** Carte de géolocalisation en lecture seule — un marqueur par bien du commercial. */
export default function BiensMap({ biens }: { biens: BienPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current).setView(COTONOU, 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    setTimeout(() => map.invalidateSize(), 0);

    return () => { map.remove(); mapRef.current = null; layerRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    if (biens.length === 0) return;

    const bounds: [number, number][] = [];
    for (const b of biens) {
      const pos: [number, number] = [b.latitude, b.longitude];
      bounds.push(pos);
      L.marker(pos).addTo(layer).bindPopup(
        `<strong>${b.label}</strong><br/>${MOD_LABEL[b.statut_moderation] ?? b.statut_moderation}`,
      );
    }
    if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    } else {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
    }
  }, [biens]);

  return <div ref={containerRef} style={{ height: 300, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--c-border)' }} />;
}
