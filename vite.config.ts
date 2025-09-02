import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = process.env;
  const apiUrl = env.VITE_API_URL || 'https://finora-api-preprod.cyrilmarchive.com/api/v1';

  return {
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: apiUrl.replace('/api/v1', ''),
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api/v1')
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  };
});
version: 0.2