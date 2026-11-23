import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In local dev, /api/analyze won't exist unless you run `vercel dev`.
    // The app gracefully falls back to rules-only if the API is unreachable.
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});