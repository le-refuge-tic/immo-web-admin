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

