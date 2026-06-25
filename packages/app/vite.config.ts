import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: 'lib/main.jsx',
      formats: ['es'],
      fileName: () => 'deopt.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'deopt.css',
      },
    },
  },
});
