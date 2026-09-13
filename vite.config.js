import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Hosts allowed to reach the dev server (Vite blocks unknown Host headers).
    // Add the production domain served through the reverse proxy.
    allowedHosts: ['taxi.mmck.lk', 'localhost'],
    // The React app calls the API with a relative "/api" path so that in
    // production it is same-origin (the reverse proxy routes taxi.mmck.lk/api
    // to the .NET API). In local dev there is no reverse proxy, so forward
    // "/api" to the API on :5171 here.
    proxy: {
      '/api': {
        target: 'http://localhost:5171',
        changeOrigin: true,
      },
    },
  },
})
