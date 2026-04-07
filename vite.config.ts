import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // ✅ Hot Module Replacement (HMR) - tự động reload khi thay đổi source code
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
    // Watch for file changes and reload
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    },
  },
})
