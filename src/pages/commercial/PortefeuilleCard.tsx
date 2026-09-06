import { useRef, useState, type MouseEvent } from 'react';
import type { Portefeuille } from '../../api/getPortefeuille';
import Skeleton from '../../components/Skeleton';

function formatFcfa(v: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(v)) + ' FCFA';
}

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

type Ripple = { id: number; x: number; y: number; size: number };

export default function PortefeuilleCard({ loading, portefeuille }: { loading: boolean; portefeuille: Portefeuille | null }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${((e.clientX - rect.left) / rect.width) * 100}%`);
    el.style.setProperty('--my', `${((e.clientY - rect.top) / rect.height) * 100}%`);
  };

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 0.9;
    const ripple: Ripple = {
      id: Date.now() + Math.random(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      size,
    };
    setRipples(rs => [...rs, ripple]);
    setTimeout(() => setRipples(rs => rs.filter(r => r.id !== ripple.id)), 750);
  };

  return (
    <div
      ref={cardRef}
      className="portefeuille-glass"
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      style={{
        borderRadius: '1rem', padding: '1.5rem', color: '#fff',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
      }}
    >
      {ripples.map(r => (
        <span
          key={r.id}
          className="portefeuille-ripple"
          style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
        />
      ))}

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.8125rem', fontWeight: 600, opacity: 0.85, marginBottom: '0.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/><path d="M18 12a2 2 0 000 4h4v-4z"/>
          </svg>
          <span>Portefeuille de la semaine</span>
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.1 }}>
          {loading ? <Skeleton onGlass width={150} height={30} radius={8} /> : formatFcfa(portefeuille?.montant ?? 0)}
        </div>
        <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '0.5rem' }}>
          {loading ? (
            <Skeleton onGlass width={260} height={13} />
          ) : portefeuille && (
            <>
              {portefeuille.nb_biens_valides} bien{portefeuille.nb_biens_valides > 1 ? 's' : ''} validé{portefeuille.nb_biens_valides > 1 ? 's' : ''} du {formatDate(portefeuille.semaine_debut)} au {formatDate(new Date(new Date(portefeuille.semaine_fin).getTime() - 86400000).toISOString())}
              {portefeuille.palier_atteint && ' · Palier 50 000 FCFA atteint !'}
            </>
          )}
        </div>
      </div>

      {(loading || (portefeuille && !portefeuille.palier_atteint)) && (
        <div style={{ position: 'relative', zIndex: 1, minWidth: 220, flex: '1 1 220px', maxWidth: 320 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', opacity: 0.85, marginBottom: '0.375rem' }}>
            <span>Progression vers le palier (20 biens)</span>
            {loading ? <Skeleton onGlass width={28} height={11} /> : <span>{portefeuille!.nb_biens_valides}/20</span>}
          </div>
          <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
            {!loading && (
              <div style={{
                height: '100%', borderRadius: 999, background: '#fff',
                width: `${Math.min(portefeuille!.nb_biens_valides / 20, 1) * 100}%`,
                transition: 'width 0.3s ease',
              }} />
            )}
          </div>
          <div style={{ fontSize: '0.6875rem', opacity: 0.75, marginTop: '0.375rem' }}>
            {loading ? (
              <Skeleton onGlass width={200} height={11} />
            ) : portefeuille!.nb_biens_valides < 10
              ? '1 000 FCFA par bien validé'
              : '1 500 FCFA par bien validé au-delà du 10e · 50 000 FCFA fixe au 20e'}
          </div>
        </div>
      )}
    </div>
  );
}
