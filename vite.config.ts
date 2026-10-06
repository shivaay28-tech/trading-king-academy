import { BRAND } from './server/brand.ts'
import { engineChatPlugin } from './server/engineChat.ts'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [
    react(),
    tailwindcss(),
    engineChatPlugin(),
    {
      name: 'brand-html',
      transformIndexHtml(html) {
        return html.replaceAll('Baazex Academy', BRAND.name)
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(root, 'src'),
    },
  },
})
