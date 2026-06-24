import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'preact'
  },
  build: {
    outDir: 'build',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: 'main.jsx',
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
