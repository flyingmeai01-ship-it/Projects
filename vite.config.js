import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({ plugins: [react(), VitePWA({ registerType: 'autoUpdate', includeAssets: ['favicon.svg'], manifest: { name: 'CARE — Cultural Dementia Support', short_name: 'CARE', description: 'Offline-first culturally personalised cognitive stimulation and caregiver support.', theme_color: '#0f766e', background_color: '#f8fafc', display: 'standalone', start_url: '/', icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }] }, workbox: { globPatterns: ['**/*.{js,css,html,svg,png,wasm}'] } })] });
