import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirAtual = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-64.png', 'icones/IconPage.png'],
      manifest: {
        name: 'Autopeças Morais — Gestão da Oficina',
        short_name: 'Autopeças Morais',
        description: 'Gestão de oficina mecânica e loja de peças: OS, estoque, vendas e financeiro.',
        lang: 'pt-BR',
        theme_color: '#161616',
        background_color: '#161616',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(dirAtual, './src'),
    },
  },
});
