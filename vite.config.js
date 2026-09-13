import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Hosts allowed to reach the dev server (Vite blocks unknown Host headers).
    // Add the production domain served through the reverse proxy.
    allowedHosts: ['taxi.mmck.lk', 'localhost'],
  },
})
