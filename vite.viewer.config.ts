import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * Builds the standalone reader used as the export template:
 * one HTML file with JS + CSS inlined, written to public/viewer/ so both the dev server
 * and the production build can serve it to the editor.
 */
export default defineConfig({
  plugins: [react(), viteSingleFile({ removeViteModuleLoader: true })],
  base: './',
  resolve: {
    // the reader never loads theme fonts on its own — exports inject the slices they need
    alias: [{ find: /^\.\.\/themes\/fonts$/, replacement: '/src/themes/fonts.viewer.ts' }],
  },
  publicDir: false,
  build: {
    outDir: 'public/viewer',
    emptyOutDir: true,
    rollupOptions: { input: 'viewer.html' },
  },
});
