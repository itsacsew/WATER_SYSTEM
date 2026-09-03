import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // DAPAT FUNCTION ni, dili Object
        manualChunks(id) {
          // I-group ang mga React-related modules
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }
            if (id.includes('xlsx') || id.includes('exceljs')) {
              return 'excel-vendor';
            }
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
});