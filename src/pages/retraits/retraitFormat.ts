export function fmtMontant(n: number | string) {
  return Number(n).toLocaleString('fr-FR') + ' FCFA';
}

export function fmtDate(raw?: string | null) {
  if (!raw) return '—';
  return new Date(raw).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** 0166000001 → 01 66 00 00 01 : plus lisible à recopier. */
export function fmtTelephone(num?: string | null) {
  if (!num) return '—';
  const chiffres = num.replace(/\s+/g, '');
  return /^\d+$/.test(chiffres) ? chiffres.replace(/(\d{2})(?=\d)/g, '$1 ') : num;
}

export function walletLabel(type?: string) {
  switch (type) {
    case 'epargne':                return 'Épargne';
    case 'revenus_locatifs':       return 'Revenus locatifs';
    case 'commission_commerciale': return 'Commission commerciale';
    default:                       return type ?? '—';
  }
}

export function libelleOperateur(op?: string | null) {
  return op === 'mtn' ? 'MTN' : op === 'moov' ? 'Moov' : '—';
}

export function initiales(nom: string) {
  return nom.split(/\s+/).filter(Boolean).slice(0, 2).map(m => m[0]?.toUpperCase()).join('') || '?';
}
