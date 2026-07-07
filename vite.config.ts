import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const appHtml = new URL('./index.html', import.meta.url).pathname
const appEntry = new URL('./src/main.tsx', import.meta.url).pathname

// https://vite.dev/config/
export default defineConfig({
  base: '/Sudoku-Webgame/',
  build: {
    rollupOptions: {
      input: {
        index: appHtml,
        main: appEntry,
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) =>
          assetInfo.name?.endsWith('.css') ? 'assets/app.css' : 'assets/[name][extname]',
      },
    },
  },
  plugins: [react()],
})
