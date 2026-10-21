import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The real backend (test server). During development, requests the app
// sends to "/api/..." are forwarded here by Vite's dev server.
const API_TARGET = 'https://api-test-v1.fandahom.com'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
        // "/api/core/auth/login" -> "https://api-test-v1.fandahom.com/core/auth/login"
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Cookies the backend sets belong to localhost from the browser's view.
        cookieDomainRewrite: '',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Make each request look like it came from the API's own site, so
            // Django's CSRF origin check accepts it without any backend change.
            proxyReq.setHeader('origin', API_TARGET)
            proxyReq.setHeader('referer', API_TARGET + '/')
          })
        },
      },
    },
  },
})