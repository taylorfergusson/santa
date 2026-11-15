import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Builds into docs/ so GitHub Pages can serve it from the main branch (/docs folder).
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    // The Supabase library makes the bundle ~500 kB (~145 kB zipped); that's fine here
    chunkSizeWarningLimit: 700,
  },
})
