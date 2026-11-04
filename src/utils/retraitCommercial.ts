/**
 * Retrait d'un commercial : règles d'affichage côté demandeur (statuts, destination,
 * blocages). Le serveur reste seul juge ; ces règles évitent de saisir un montant pour rien.
 */

export const RETRAIT_MINIMUM = 500;

export type OperateurRetrait = 'mtn' | 'moov';

export const OPERATEURS: ReadonlyArray<{ value: OperateurRetrait; label: string }> = [
  { value: 'mtn', label: 'MTN' },
  { value: 'moov', label: 'Moov' },
];

export function libelleOperateur(operateur: string | null | undefined): string {
  return OPERATEURS.find(o => o.value === operateur)?.label ?? '';
}

/** Réponse de `GET /wallets/me/numero-retrait`. */
export interface NumeroRetraitInfo {
  numero_retrait: string | null;
  masque: string | null;
  source: string;
  operateur_retrait?: OperateurRetrait | null;
  /** Fin de la suspension de 48 h après un changement de numéro ou d'opérateur (date ISO). */
  retraits_suspendus_jusqu_a?: string | null;
}

export interface LimitesRetrait {
  min: number;
  max: number;
}

const fcfa = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} FCFA`;

/** Message sous le champ montant dès la saisie, ou chaîne vide si le montant est valide. */
export function messageMontant(montant: string, solde: number, limites?: Partial<LimitesRetrait>): string {
  if (!montant.trim()) return '';
  const valeur = Number(montant);
  const min = limites?.min ?? RETRAIT_MINIMUM;
  const max = limites?.max;
  if (!Number.isFinite(valeur) || valeur <= 0) return 'Saisissez un montant en chiffres.';
  if (!Number.isInteger(valeur)) return 'Saisissez un montant entier, sans décimales.';
  if (valeur > solde) return `Ce montant dépasse votre solde disponible (${fcfa(solde)}).`;
  if (valeur < min) return `Le minimum de retrait est de ${fcfa(min)}.`;
  if (max !== undefined && Number.isFinite(max) && valeur > max) return `Le maximum par retrait est de ${fcfa(max)}.`;
  return '';
}

/** « 12/11 à 14:30 » tant que la suspension court, sinon null. */
export function formaterFinSuspension(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime()) || d.getTime() <= Date.now()) return null;
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/** Pourquoi aucun retrait n'est possible pour l'instant, ou null. Informations non chargées : null. */
export function raisonBlocage(info: NumeroRetraitInfo | null): string | null {
  if (!info) return null;
  if (!info.numero_retrait) return 'Aucun numéro de téléphone enregistré sur votre compte.';
  if (!info.operateur_retrait) return 'Choisissez votre opérateur Mobile Money (MTN ou Moov) pour pouvoir retirer.';
  const fin = formaterFinSuspension(info.retraits_suspendus_jusqu_a);
  if (fin) return `Par sécurité, les retraits sont suspendus jusqu'au ${fin} (changement récent de numéro ou d'opérateur).`;
  return null;
}

// ─── Statuts vus par le demandeur ─────────────────────────────────────────────

export type TonRetrait = 'attente' | 'succes' | 'echec';

const STATUTS: Record<string, { label: string; ton: TonRetrait }> = {
  en_attente: { label: 'En cours de traitement', ton: 'attente' },
  en_cours: { label: 'Virement en cours', ton: 'attente' },
  en_attente_fonds: { label: 'En attente de traitement', ton: 'attente' },
  approuve: { label: 'En cours de traitement', ton: 'attente' },
  envoye: { label: 'Envoyé', ton: 'succes' },
  echoue: { label: 'Échoué, remboursé', ton: 'echec' },
  rejete: { label: 'Refusé, remboursé', ton: 'echec' },
};

export function infoStatut(statut: string): { label: string; ton: TonRetrait } {
  return STATUTS[statut] ?? { label: statut, ton: 'attente' };
}

export function estEnCours(statut: string): boolean {
  return infoStatut(statut).ton === 'attente';
}

export const COULEUR_TON: Record<TonRetrait, string> = {
  attente: '#f59e0b',
  succes: '#10b981',
  echec: '#ef4444',
};

/** Ce qu'il faut dire juste après la demande : le virement part tout de suite, l'issue arrive ensuite. */
export function messageApresDemande(retrait: { statut?: string; message?: string | null } | undefined): { ok: boolean; texte: string } {
  const statut = retrait?.statut;
  if (statut === 'echoue' || statut === 'rejete') {
    return { ok: false, texte: retrait?.message || 'Le virement a échoué. Le montant a été remis sur votre portefeuille.' };
  }
  if (statut === 'envoye') return { ok: true, texte: 'Virement envoyé.' };
  if (statut === 'en_attente_fonds') return { ok: true, texte: 'Demande enregistrée : elle sera traitée par notre équipe. Suivez son statut ci-dessous.' };
  return { ok: true, texte: "Virement lancé. Vous serez notifié dès que l'argent arrive sur votre numéro." };
}

/** Ramène un numéro enregistré (+22901XXXXXXXX ou 01XXXXXXXX) aux 10 chiffres locaux. */
export function numeroLocal(brut: string | null | undefined): string {
  const chiffres = String(brut ?? '').replace(/\D/g, '');
  return chiffres.length === 13 && chiffres.startsWith('229') ? chiffres.slice(3) : chiffres;
}

/** Numéro béninois : 10 chiffres, préfixe 01. */
export function numeroValide(brut: string): boolean {
  return /^01\d{8}$/.test(numeroLocal(brut));
}
