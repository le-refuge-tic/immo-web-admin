// Règle du projet : aucune boîte native (window.confirm / alert / prompt).
// Les confirmations passent par useConfirm (src/shared/dialogues), les alertes par un toast.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const RACINE = new URL('../src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const MOTIF = /(?<![\w.$])(?:window\.)?(confirm|alert|prompt)\s*\(/
const fichiers = []
const parcourir = dossier => {
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom)
    if (statSync(chemin).isDirectory()) parcourir(chemin)
    else if (/\.(tsx?|jsx?)$/.test(nom) && !/\.test\.|\.spec\./.test(nom)) fichiers.push(chemin)
  }
}
parcourir(RACINE)

const fautes = []
for (const f of fichiers) {
  readFileSync(f, 'utf8').split('\n').forEach((ligne, i) => {
    if (/^\s*(\*|\/\*|\/\/)/.test(ligne)) return
    const code = ligne.replace(/\/\/.*$/, '')
    if (MOTIF.test(code) || /window\.(confirm|alert|prompt)\b/.test(code)) fautes.push(`${relative(RACINE, f)}:${i + 1}  ${ligne.trim()}`)
  })
}
if (fautes.length) {
  console.error(`Boîtes natives interdites (utilisez useConfirm ou un toast) :\n${fautes.join('\n')}`)
  process.exit(1)
}
console.log(`check:no-native-dialogs — ${fichiers.length} fichiers, aucune boîte native.`)
