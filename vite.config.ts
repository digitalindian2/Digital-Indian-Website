import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // This is the crucial part that proxies requests from the front-end to the back-end during development.
    // It tells the Vite dev server to forward any request starting with /api to your backend running on port 3001.
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
