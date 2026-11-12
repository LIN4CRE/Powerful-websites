import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

const repoName = 'Powerful-websites';

/**
 * GitHub Pages serves project sites from /<repo>/, so production builds need a
 * base path. Local development and preview use "/" so links keep working.
 * Override with VITE_BASE (e.g. "/" for a custom domain).
 */
export default defineConfig(({ command }) => ({
  base:
    command === 'build'
      ? process.env.VITE_BASE ?? `/${repoName}/`
      : '/',
  plugins: [react(), tailwindcss()],
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
  },
  preview: {
    host: '0.0.0.0',
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    sourcemap: false,
    // The pre-built site can be committed to docs/ for branch-based GitHub Pages
    // deployments when Actions runners are unavailable.
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
