import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('xlsx') || id.includes('dompurify')) {
            return 'export-vendor';
          }

          if (id.includes('recharts') || id.includes('d3-')) {
            return 'charts-vendor';
          }
        },
      },
    },
  },
  server: {
    proxy: {
      '/api/v1/ai': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:4002',
        changeOrigin: true,
      },
    },
  },
})
