import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Polyfill process.env for the app's existing code usage
    'process.env': {}
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});