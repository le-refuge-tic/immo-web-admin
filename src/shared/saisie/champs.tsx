/**
 * Lot 15 — champs de saisie communs, sans style imposé (className / style passés tels quels).
 * Ils remplacent les `<input type="number">` et les champs téléphone libres : chiffres
 * seulement, à la frappe comme au collage. `onChange` reçoit l'évènement avec la valeur
 * BRUTE (chiffres sans espace) dans `e.target.value` : les appelants existants n'ont pas à changer.
 */
import { useLayoutEffect, useRef, type ChangeEvent, type CSSProperties, type InputHTMLAttributes } from 'react'
import { curseurApresFormatage, formaterMilliers, saisieNombre } from './nombres'
import { INDICATIF_BENIN, LONGUEUR_TELEPHONE, PLACEHOLDER_TELEPHONE, saisieTelephone } from './telephone'
import { aujourdhui } from './schemas'

type Base = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'min' | 'max'>
type ChangementBrut = (e: ChangeEvent<HTMLInputElement>) => void

export interface NumberInputProps extends Base {
  value: string | number | null | undefined
  onChange?: ChangementBrut
  /** Reçoit directement la valeur brute (alternative à `onChange`). */
  onValueChange?: (brut: string) => void
  /** Bornes : `max` bloque la saisie, `min` est indicatif (contrôlé par le schéma). */
  min?: number
  max?: number
  decimales?: boolean
  /** Affiche les milliers séparés (« 150 000 »). */
  milliers?: boolean
}

/** Remplace la valeur affichée par la valeur brute avant de prévenir l'appelant. */
function transmettre(e: ChangeEvent<HTMLInputElement>, brut: string, onChange?: ChangementBrut, onValueChange?: (b: string) => void) {
  e.target.value = brut
  onChange?.(e)
  onValueChange?.(brut)
}

export function NumberInput({ value, onChange, onValueChange, max, decimales = false, milliers = false, ...reste }: NumberInputProps) {
  const ref = useRef<HTMLInputElement>(null)
  const curseur = useRef<number | null>(null)
  const brutActuel = value == null ? '' : String(value)
  const affiche = milliers ? formaterMilliers(brutActuel) : brutActuel

  useLayoutEffect(() => {
    if (curseur.current != null && ref.current && document.activeElement === ref.current) {
      ref.current.setSelectionRange(curseur.current, curseur.current)
      curseur.current = null
    }
  })

  const changer = (e: ChangeEvent<HTMLInputElement>) => {
    const saisi = e.target.value
    const brut = saisieNombre(saisi, { decimales, max })
    if (brut === null) {
      // Au-delà du maximum : on garde l'ancienne valeur, curseur inchangé.
      e.target.value = affiche
      return
    }
    if (milliers) curseur.current = curseurApresFormatage(saisi, e.target.selectionStart ?? saisi.length, formaterMilliers(brut))
    transmettre(e, brut, onChange, onValueChange)
  }

  return (
    <input
      {...reste}
      ref={ref}
      type="text"
      inputMode={decimales ? 'decimal' : 'numeric'}
      autoComplete={reste.autoComplete ?? 'off'}
      value={affiche}
      onChange={changer}
    />
  )
}

/** Montant en FCFA : entier, milliers séparés. */
export function MoneyInput(props: Omit<NumberInputProps, 'decimales' | 'milliers'>) {
  return <NumberInput {...props} milliers />
}

export interface PhoneInputProps extends Base {
  value: string | null | undefined
  onChange?: ChangementBrut
  onValueChange?: (national: string) => void
  /** Affiche « +229 » devant le champ (dans un conteneur flex). */
  indicatif?: boolean
  classeIndicatif?: string
  /** Numéro hors Bénin (indicatif choisi à part) : chiffres seulement, 15 au plus (E.164). */
  etranger?: boolean
}

/** Numéro béninois : 10 chiffres nationaux, indicatif collé retiré. */
const LONGUEUR_MAX_INTERNATIONALE = 15

export function PhoneInput({ value, onChange, onValueChange, indicatif = false, classeIndicatif, etranger = false, style, ...reste }: PhoneInputProps) {
  const nettoyer = (v: string) => (etranger ? v.replace(/\D/g, '').slice(0, LONGUEUR_MAX_INTERNATIONALE) : saisieTelephone(v))
  const champ = (
    <input
      {...reste}
      style={indicatif ? { ...style, flex: 1, minWidth: 0 } : style}
      type="tel"
      inputMode="numeric"
      autoComplete={reste.autoComplete ?? 'tel-national'}
      maxLength={etranger ? LONGUEUR_MAX_INTERNATIONALE : LONGUEUR_TELEPHONE}
      placeholder={reste.placeholder ?? (etranger ? undefined : PLACEHOLDER_TELEPHONE)}
      value={nettoyer(value ?? '')}
      onChange={e => transmettre(e, nettoyer(e.target.value), onChange, onValueChange)}
    />
  )
  if (!indicatif) return champ
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span className={classeIndicatif} aria-hidden="true" style={classeIndicatif ? undefined : { fontWeight: 600, opacity: 0.75 }}>{INDICATIF_BENIN}</span>
      {champ}
    </span>
  )
}

export function EmailInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return <input autoComplete="email" maxLength={255} {...props} type="email" inputMode="email" />
}

/** Texte borné : `maxLength` obligatoire. */
export function TexteInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { maxLength: number }) {
  return <input {...props} type="text" />
}

/** Date AAAA-MM-JJ ; `futur` empêche de choisir une date passée. */
export function DateInput({ futur = false, min, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { futur?: boolean }) {
  return <input {...props} type="date" min={futur ? (min && String(min) > aujourdhui() ? min : aujourdhui()) : min} />
}

/** Message d'erreur sous un champ (relié par `aria-describedby`), rien si pas d'erreur. */
export function ErreurChamp({ id, message, className, style }: { id: string; message?: string; className?: string; style?: CSSProperties }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className={className} style={className ? style : { color: '#DC2626', fontSize: 12, margin: '4px 0 0', ...style }}>
      {message}
    </p>
  )
}
