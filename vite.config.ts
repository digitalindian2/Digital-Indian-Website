import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Add a proxy to handle API requests during local development
  server: {
    proxy: {
      '/api': 'http://localhost:3000', // Assuming your local backend runs on port 3000
    },
  },
});
