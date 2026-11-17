/* Script en ligne de commande : la sortie console est voulue. */
/* eslint-disable no-console */
// Lot 16 — les cas de référence de la grille des primes (parité front / backend) doivent être
// la copie exacte de ceux d'immo-backend. Vérifié quand le backend est cloné à côté.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ICI = join(process.cwd(), 'src', 'pages', 'commercial', 'cas-grille-primes.json')
const LA_BAS = join(process.cwd(), '..', 'immo-backend', 'src', 'users', '__fixtures__', 'cas-grille-primes.json')
if (!existsSync(LA_BAS)) {
  console.log('check:grille — immo-backend absent à côté de ce dépôt : vérification ignorée.')
  process.exit(0)
}
const lire = p => JSON.stringify(JSON.parse(readFileSync(p, 'utf8')))
if (lire(ICI) !== lire(LA_BAS)) {
  console.error('check:grille — les cas de la grille des primes diffèrent de ceux d’immo-backend : recopiez src/users/__fixtures__/cas-grille-primes.json.')
  process.exit(1)
}
console.log(`check:grille — ${JSON.parse(readFileSync(ICI, 'utf8')).length} cas identiques à immo-backend.`)
