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
        // In docker-compose the API is a separate container, reachable at
        // http://api:5171 (the service name) — NOT localhost, which inside the
        // frontend container points at the frontend itself. Set
        // API_PROXY_TARGET=http://api:5171 there. Falls back to localhost:5171
        // for local (non-docker) dev where the API runs on the host.
        target: process.env.API_PROXY_TARGET || 'http://localhost:5171',
        changeOrigin: true,
      },
    },
  },
})
