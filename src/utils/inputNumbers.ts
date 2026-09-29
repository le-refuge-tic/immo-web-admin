import type { KeyboardEvent } from 'react';

/**
 * Bloc les caractères non numériques dans un <input type="number">.
 *
 * - intOnly=true  → autorise uniquement les chiffres et la touche retour arrière
 * - intOnly=false → autorise aussi un seul point décimal
 *
 * Toujours bloquer : 'e', 'E', '+', '-', ','
 */
export function blockInvalidNumberKey(e: KeyboardEvent<HTMLInputElement>, intOnly = false) {
  const always = ['e', 'E', '+', ','];
  if (always.includes(e.key)) { e.preventDefault(); return; }
  if (e.key === '-') { e.preventDefault(); return; }
  if (intOnly && e.key === '.') { e.preventDefault(); return; }
}

/** Comme blockInvalidNumberKey mais autorise '-' (pour latitude/longitude). */
export function blockInvalidCoordKey(e: KeyboardEvent<HTMLInputElement>) {
  if (['e', 'E', '+', ','].includes(e.key)) e.preventDefault();
}

/**
 * Sanitize la valeur saisie en s'assurant qu'elle reste dans [min, max].
 * Retourne la valeur corrigée sous forme de string.
 */
export function clampNumberValue(value: string, min: number, max: number): string {
  const n = parseFloat(value);
  if (isNaN(n)) return value;
  if (n < min) return String(min);
  if (n > max) return String(max);
  return value;
}
