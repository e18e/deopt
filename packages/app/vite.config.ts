import { defineConfig } from 'vite'
import preact from '@preact/preset-vite';

export default defineConfig({
	plugins: [preact()],
  build: {
    outDir: 'build',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: 'lib/main.jsx',
      formats: ['es'],
      fileName: () => 'deoptigate.js'
    },
    rollupOptions: {
      output: {
        assetFileNames: 'deoptigate.css'
      }
    }
  }
})
