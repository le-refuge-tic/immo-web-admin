#!/usr/bin/env node
/* Script en ligne de commande : la sortie console est voulue. */
/* eslint-disable no-console */
// Vérifie que chaque lien interne du code (navigate('/…'), to="/…", href="/…",
// path: '/…') correspond à une route déclarée dans src/App.tsx.
// Usage : node scripts/check-links.mjs   (code de sortie 1 si un lien est mort)
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const SRC = join(ROOT, 'src')

// ── 1. Routes déclarées (imbrication des <Route> respectée) ────────────────
function declaredRoutes(appSource) {
  const routes = []
  const stack = []
  let i = 0
  while (i < appSource.length) {
    const open = appSource.indexOf('<Route', i)
    const close = appSource.indexOf('</Route>', i)
    if (open < 0 && close < 0) break
    if (close >= 0 && (open < 0 || close < open)) { stack.pop(); i = close + 8; continue }
    // Lit la balise jusqu'au '>' de niveau 0 (les attributs JSX contiennent des '>')
    let j = open + 6, depth = 0
    while (j < appSource.length && !(appSource[j] === '>' && depth === 0)) {
      if (appSource[j] === '{') depth++
      else if (appSource[j] === '}') depth--
      j++
    }
    const attrs = appSource.slice(open + 6, j)
    const selfClosing = appSource[j - 1] === '/'
    const path = /\bpath="([^"]*)"/.exec(attrs.replace(/\{[^{}]*(\{[^{}]*\}[^{}]*)*\}/g, ''))?.[1]
    const isIndex = /(^|\s)index(\s|$|\/)/.test(attrs.replace(/\{[\s\S]*\}/g, ''))
    const parent = stack.at(-1) ?? ''
    const full = path === undefined
      ? parent
      : path.startsWith('/') ? path : `${parent.replace(/\/$/, '')}/${path}`
    if (path !== undefined || isIndex) routes.push(full || '/')
    if (!selfClosing) stack.push(full)
    i = j + 1
  }
  return [...new Set(routes)]
}

const toRegex = (route) => {
  if (route.endsWith('*')) return null // route attrape-tout : ignorée pour la vérification
  // Un paramètre optionnel (« /:id? ») rend tout le segment facultatif, slash compris.
  const body = route
    .replace(/\/$/, '')
    .split('/')
    .filter(Boolean)
    .map(seg => {
      if (!seg.startsWith(':')) return '/' + seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      return seg.endsWith('?') ? '(?:/[^/]+)?' : '/[^/]+'
    })
    .join('')
  return new RegExp(`^${body}/?$`)
}

// ── 2. Liens internes utilisés dans le code ───────────────────────────────
const LINK_PATTERNS = [
  /navigate\(\s*[`'"](\/[^`'"?#]*)/g,
  /\bto=\{?\s*[`'"](\/[^`'"?#]*)/g,
  /\bhref=\{?\s*[`'"](\/[^`'"?#]*)/g,
  /\bpath:\s*[`'"](\/[^`'"?#]*)/g,
  /post_login_redirect',\s*[`'"](\/[^`'"?#]*)/g,
]

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { if (name !== '__tests__') yield* files(p) }
    else if (/\.(tsx?|jsx?)$/.test(name)) yield p
  }
}

const app = readFileSync(join(SRC, 'App.tsx'), 'utf8')
const routes = declaredRoutes(app)
const matchers = routes.map(toRegex).filter(Boolean)
// Fichiers statiques servis depuis public/ (images, manifest…)
const isStatic = (link) => /\.[a-z0-9]{2,5}$/i.test(link)

const dead = []
for (const file of files(SRC)) {
  const src = readFileSync(file, 'utf8')
  for (const re of LINK_PATTERNS) {
    for (const m of src.matchAll(re)) {
      // Segments dynamiques de template (`/biens/${id}`) remplacés par une valeur fictive
      const link = m[1].replace(/\$\{[^}]*\}/g, 'x')
      if (isStatic(link) || matchers.some(r => r.test(link))) continue
      const line = src.slice(0, m.index).split('\n').length
      dead.push(`${relative(ROOT, file)}:${line}  ${m[1]}`)
    }
  }
}

console.log(`${routes.length} routes déclarées.`)
if (dead.length) {
  console.error(`\n${dead.length} lien(s) interne(s) sans route correspondante :\n  ${dead.join('\n  ')}`)
  process.exit(1)
}
console.log('Aucun lien interne cassé.')
