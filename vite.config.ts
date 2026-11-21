import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// 默认部署在 GitHub Pages 子路径；其他静态托管可用 VITE_BASE=/ 覆盖
const base = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.VITE_BASE || '/AdvKanban/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: '轮盘清单 - 每日任务轮盘',
        short_name: '轮盘清单',
        description: '轮盘清单 + 看板 + 游戏化冒险故事',
        theme_color: '#6c5ce7',
        background_color: '#0f0e17',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  preview: {
    host: '0.0.0.0',
    port: 4173
  }
})
