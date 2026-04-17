import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const aiProxyTarget = env.VITE_PROXY_AI_TARGET || 'http://localhost:8000'
  const apiProxyTarget = env.VITE_PROXY_API_TARGET || 'http://localhost:4000'

  return {
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
          target: aiProxyTarget,
          changeOrigin: true,
        },
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
