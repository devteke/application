import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    watch: {
      usePolling: true,
      interval: 100,
    },
    port: 3000,
    proxy: {
      // /iddaa/... isteklerini iddaa API'sine yönlendirir (CORS bypass, sadece dev)
      '/iddaa': {
        target: 'https://sportsbookv2.iddaa.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/iddaa/, ''),
        headers: {
          Referer: 'https://www.nesine.com/',
          Origin: 'https://www.nesine.com',
        },
      },
      '/misli': {
        target: 'https://apivx.misli.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/misli/, ''),
        headers: {
          Referer: 'https://www.misli.com/',
          Origin: 'https://www.misli.com',
        },
      },
    },
  },
})
