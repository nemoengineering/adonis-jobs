import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    tanstackRouter({ autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(),
    viteSingleFile(),
  ],

  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
  },
})
