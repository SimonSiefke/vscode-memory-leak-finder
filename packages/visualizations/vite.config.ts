import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        memoryCity: resolve(root, 'index.html'),
        retainerRiver: resolve(root, 'retainer-river/index.html'),
      },
    },
  },
  plugins: [react()],
  server: {
    port: 5174,
  },
})
