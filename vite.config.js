import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/volleyball-tactics/',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      // Landing page at the site root, the React coaching app under /app/.
      // Setter Signals and Serve Receive are static pages copied from public/.
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        app: resolve(import.meta.dirname, 'app/index.html'),
      },
    },
  },
})
