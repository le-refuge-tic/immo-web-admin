/* Script en ligne de commande : la sortie console est voulue. */
/* eslint-disable no-console */
// Lot 15 : aucun champ numérique brut (`type="number"`) ni champ téléphone libre en dehors des
// composants communs de `src/shared/saisie` (NumberInput, MoneyInput, PhoneInput). Ces champs
// acceptaient « e », « - », le collage de texte et les numéros de mauvaise longueur.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const RACINE = join(process.cwd(), 'src')
const EXCLU = join('src', 'shared', 'saisie') + sep
const REGLES = [
  { motif: /type\s*=\s*(?:["']number["']|\{\s*["']number["']\s*\})/, message: 'champ numérique brut : utilisez NumberInput ou MoneyInput' },
  { motif: /type\s*=\s*(?:["']tel["']|\{\s*["']tel["']\s*\})/, message: 'champ téléphone brut : utilisez PhoneInput' },
  { motif: /<input\b[^>]*value=\{[^}]*\b(?:tel|telephone|phone|numero(?:Tel|Retrait)?|propTel)\b/i, message: 'champ téléphone brut : utilisez PhoneInput' },
]

const fichiers = []
const parcourir = d => {
  for (const n of readdirSync(d)) {
    const p = join(d, n)
    if (statSync(p).isDirectory()) parcourir(p)
    else if (/\.tsx?$/.test(n) && !/\.test\.tsx?$/.test(n)) fichiers.push(p)
  }
}
parcourir(RACINE)

const fautes = []
for (const f of fichiers) {
  const rel = relative(process.cwd(), f)
  if ((rel + sep).startsWith(EXCLU) || rel.startsWith(EXCLU)) continue
  readFileSync(f, 'utf8').split(/\r?\n/).forEach((ligne, i) => {
    if (ligne.includes('check:inputs ignorer')) return
    const r = REGLES.find(x => x.motif.test(ligne))
    if (r) fautes.push(`${rel}:${i + 1} — ${r.message}`)
  })
}

if (fautes.length) {
  console.error(`check:inputs — ${fautes.length} champ(s) à corriger :\n${fautes.join('\n')}`)
  process.exit(1)
}
console.log(`check:inputs — ${fichiers.length} fichiers, aucun champ numérique ou téléphone brut.`)
