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
      workbox: {
        // No cachear llamadas a la API del backend: los datos del bebé
        // siempre deben venir frescos del servidor, no de una copia offline.
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin.includes('babycare-backend'),
            handler: 'NetworkOnly',
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
