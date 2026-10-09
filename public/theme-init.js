// Applique le thème avant le premier rendu React pour éviter un flash clair → sombre.
// Doit rester aligné sur src/context/ThemeContext.tsx (clé admin_theme, défaut « system »).
(function () {
  var pref = 'system'
  try { pref = localStorage.getItem('admin_theme') || 'system' } catch (e) { /* ignore */ }
  var dark = pref === 'dark' || (pref !== 'light' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
})()
