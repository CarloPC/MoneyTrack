import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// NOTE: If your existing vite.config.js has other plugins/settings (e.g. path
// aliases), merge them in here — don't just overwrite blindly. The important
// additions are the VitePWA import and the entry in the plugins array below.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png'],
      manifest: {
        name: 'IponTrack',
        short_name: 'IponTrack',
        description: 'Track your money, income and expenses.',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Cache the app shell so it can still load while offline.
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            // Don't try to cache/serve Firebase network calls while offline —
            // let those fail naturally so FinanceContext / AuthContext can
            // surface real errors instead of stale cached data.
            urlPattern: ({ url }) =>
              url.hostname.includes('firestore.googleapis.com') ||
              url.hostname.includes('identitytoolkit.googleapis.com'),
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: {
        enabled: true, // lets you test the PWA in `npm run dev` too
      },
    }),
  ],
})
