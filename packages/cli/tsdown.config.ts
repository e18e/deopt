import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['lib/run.js'],
  format: 'esm',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  dts: false,
  outExtensions: () => ({ js: '.js' }),
  // The frontend ships as static assets served at runtime, so copy its built
  // output alongside the bundle rather than bundling it as JS.
  copy: [
    { from: '../app/static', to: 'dist/app' },
    { from: '../app/dist', to: 'dist/app' },
  ],
});
