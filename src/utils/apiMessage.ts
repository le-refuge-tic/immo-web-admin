/**
 * Message d'erreur à montrer à l'utilisateur à partir d'une erreur Axios.
 * Renvoie `undefined` quand rien d'utile n'est disponible : l'appelant garde
 * alors son message de repli (`apiMessage(err) || 'Message de repli'`).
 *
 * Les messages techniques de l'API (listes de validation, anglais, codes Nest)
 * ne sont jamais affichés tels quels.
 */
const TECHNIQUE = /\b(must|should|is not|cannot|exception|unauthorized|forbidden|not found|bad request|internal server error|too many requests)\b/i

type ErreurHttp = {
  response?: { status?: number; data?: { message?: unknown }; headers?: Record<string, string | undefined> }
  request?: unknown
}

function delaiAttente(headers?: Record<string, string | undefined>): string {
  const brut = headers?.['retry-after'] ?? headers?.['retry-after-default']
  const s = Number(brut)
  if (!Number.isFinite(s) || s <= 0) return 'dans une minute'
  return s < 60 ? `dans ${Math.ceil(s)} secondes` : `dans ${Math.ceil(s / 60)} minute${s >= 120 ? 's' : ''}`
}

export function apiMessage(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined
  const { response, request } = err as ErreurHttp
  if (!response) {
    return request ? 'Connexion impossible. Vérifiez votre connexion Internet et réessayez.' : undefined
  }
  const status = response.status ?? 0
  if (status === 429) return `Trop de tentatives. Réessayez ${delaiAttente(response.headers)}.`
  if (status === 413) return 'Fichier trop volumineux. Choisissez une image plus légère.'
  if (status >= 500) return 'Le service est momentanément indisponible. Réessayez dans quelques instants.'
  const msg = response.data?.message
  if (typeof msg === 'string' && msg.trim() && !TECHNIQUE.test(msg)) return msg.trim()
  return undefined
}
