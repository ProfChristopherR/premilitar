import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    watch: {
      // Ignorar carpetas grandes sincronizadas por OneDrive para evitar error EBUSY
      ignored: [
        '**/Media/**',
        '**/node_modules/**',
        '**/public/assets/**',
        '**/src/assets/media/**',
        '**/*.{tif,tiff,heic,HEIC,mp4,glb,obj}',
      ],
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        area: resolve(__dirname, 'area.html'),
      },
    },
  },
});
