import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // injectManifest en vez de generateSW: hace falta código propio en el
      // service worker para manejar los eventos push, que un SW generado
      // automáticamente no incluye. Ver src/sw.ts.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        // El bundle principal supera el límite por defecto de 2 MB.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      includeAssets: ['favicon.png', 'pwa-icons/apple-touch-icon.png'],
      manifest: {
        name: 'Baby Care',
        short_name: 'Baby Care',
        description: 'Tu guía amorosa en cada pequeño gran paso — seguimiento de embarazo y del crecimiento de tu bebé.',
        start_url: '/dashboard',
        scope: '/',
        display: 'standalone',
        background_color: '#F4F2E5',
        theme_color: '#7C5CBF',
        lang: 'es-CL',
        icons: [
          {
            src: '/pwa-icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    // Evita que el monorepo levante dos copias de React (fix para lucide-react)
    dedupe: ['react', 'react-dom', 'react-router-dom', 'react-router'],
    alias: {
      'react': path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'react-router', 'lucide-react'],
  },
})
