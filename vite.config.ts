import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Prevent Vite from watching the Rust project (avoids rebuild loops with `tauri dev`).
  server: {
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    // Keep woff2 as separate files so unicode-range shards stay lazy-loaded.
    assetsInlineLimit: (filePath) =>
      filePath.endsWith('.woff2') ? false : undefined,
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})

