import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname),
  plugins: [preact()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'JotilChat',
      formats: ['iife'],
      fileName: () => 'widget.js',
    },
    outDir: resolve(__dirname, 'build'),
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../src/types'),
    },
  },
});
