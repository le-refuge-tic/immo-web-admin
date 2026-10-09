import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Un build de production sans API en HTTPS doit échouer plutôt que de
  // retomber sur http://localhost (fallback des appels API).
  if (mode === 'production') {
    const apiUrl = loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL
    if (!apiUrl || !/^https:\/\//.test(apiUrl)) {
      throw new Error('VITE_API_URL doit être définie en HTTPS pour un build de production (ex: https://api.example.com/api/v1).')
    }
  }
  return { plugins: [react()] }
})
