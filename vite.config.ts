import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Prevent Vite from watching the Rust project (avoids rebuild loops with `tauri dev`).
  server: {
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
})
