import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

/**
 * Vercel (the primary platform) serves the app from the domain root, so "/" is
 * the default base for every build. The optional GitHub Pages build overrides it
 * with VITE_BASE=/Powerful-websites/ (see `npm run build:pages`).
 */
export default defineConfig(({ mode }) => ({
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    react(),
    tailwindcss(),
    ...(mode === 'test'
      ? []
      : [
          VitePWA({
            // "prompt" gives the visitor control: a new version is announced,
            // never silently swapped underneath them.
            registerType: 'prompt',
            injectRegister: null,
            strategies: 'generateSW',
            manifestFilename: 'manifest.webmanifest',
            includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png', 'robots.txt'],
            manifest: {
              name: 'Powerful Websites',
              short_name: 'Powerful',
              description: 'Discover the power of the open web.',
              // Relative URLs keep the manifest correct at the domain root
              // (Vercel) and under /Powerful-websites/ (optional Pages build).
              id: './',
              start_url: './',
              scope: './',
              display: 'standalone',
              display_override: ['standalone', 'minimal-ui'],
              orientation: 'any',
              theme_color: '#05070c',
              background_color: '#05070c',
              lang: 'en',
              dir: 'ltr',
              categories: ['productivity', 'utilities', 'reference'],
              icons: [
                { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                {
                  src: 'icons/maskable-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
                },
              ],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest,txt}'],
              navigateFallback: 'index.html',
              // API calls must reach the network handler below, not the shell.
              navigateFallbackDenylist: [/^\/api\//],
              cleanupOutdatedCaches: true,
              clientsClaim: false,
              skipWaiting: false,
              runtimeCaching: [
                {
                  // Fresh directory data when online, last good copy when not.
                  urlPattern: ({ url, sameOrigin }: { url: URL; sameOrigin: boolean }) =>
                    sameOrigin && url.pathname === '/api/data',
                  handler: 'NetworkFirst',
                  options: {
                    cacheName: 'pw-directory-data',
                    networkTimeoutSeconds: 4,
                    expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 },
                    cacheableResponse: { statuses: [0, 200] },
                  },
                },
                {
                  // Locally cached website logos are static and safe to keep.
                  urlPattern: ({ url, sameOrigin }: { url: URL; sameOrigin: boolean }) =>
                    sameOrigin && url.pathname.startsWith('/logos/'),
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'pw-site-logos',
                    expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
                    cacheableResponse: { statuses: [0, 200] },
                  },
                },
              ],
            },
          }),
        ]),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@data': fileURLToPath(new URL('./data', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    // Optional host allowlist for proxied preview environments
    // (e.g. DEV_ALLOWED_HOSTS=.e2b.app). Unset means Vite's localhost default.
    allowedHosts: process.env.DEV_ALLOWED_HOSTS
      ? process.env.DEV_ALLOWED_HOSTS.split(',')
      : undefined,
  },
  preview: {
    host: '0.0.0.0',
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    sourcemap: false,
    // Vercel builds into dist/. The optional GitHub Pages build (see
    // `npm run build:pages`) writes to docs/ with VITE_BASE=/Powerful-websites/.
    outDir: process.env.BUILD_OUT_DIR ?? 'dist',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{ts,tsx}'],
    css: false,
  },
}));
