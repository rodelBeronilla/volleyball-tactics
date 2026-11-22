import { readFileSync } from 'node:fs'
import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

// GitHub Pages serves the app under /volleyball-tactics/; the Cloud Run image is
// built with VITE_BASE=/ (see platform/web/Dockerfile).
export default defineConfig({
  base: process.env.VITE_BASE || '/volleyball-tactics/',
  plugins: [react(), tailwindcss()],
  define: {
    'import.meta.env.APP_VERSION': JSON.stringify(pkg.version),
  },
})
