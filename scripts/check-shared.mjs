// src/shared doit rester identique dans immo-web-admin et immo-web-user (logique pure commune :
// envois de médias, dialogues, référentiel des biens). Vérifié quand l'autre dépôt est cloné à côté.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ICI = join(process.cwd(), 'src', 'shared')
const AUTRE_DEPOT = process.cwd().replace(/[\/]$/, '').endsWith('immo-web-admin') ? 'immo-web-user' : 'immo-web-admin'
const LA_BAS = join(process.cwd(), '..', AUTRE_DEPOT, 'src', 'shared')
if (!existsSync(LA_BAS)) {
  console.log(`check:shared — ${AUTRE_DEPOT} absent à côté de ce dépôt : vérification ignorée.`)
  process.exit(0)
}
const lister = racine => {
  const res = []
  const parcourir = d => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? parcourir(p) : res.push(relative(racine, p)) } }
  parcourir(racine)
  return res.sort()
}
const normaliser = t => t.replace(/\r\n/g, '\n')
const a = lister(ICI)
const b = lister(LA_BAS)
const ecarts = [
  ...a.filter(f => !b.includes(f)).map(f => `absent de ${AUTRE_DEPOT} : ${f}`),
  ...b.filter(f => !a.includes(f)).map(f => `absent d'ici : ${f}`),
  ...a.filter(f => b.includes(f) && normaliser(readFileSync(join(ICI, f), 'utf8')) !== normaliser(readFileSync(join(LA_BAS, f), 'utf8'))).map(f => `différent : ${f}`),
]
if (ecarts.length) {
  console.error(`src/shared diverge de ${AUTRE_DEPOT} :\n  ${ecarts.join('\n  ')}`)
  process.exit(1)
}
console.log(`check:shared — ${a.length} fichiers identiques à ${AUTRE_DEPOT}.`)
