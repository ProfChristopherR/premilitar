import { resolve } from 'path';
import { defineConfig } from 'vite';
import fs from 'fs';

function localContentSaver() {
  return {
    name: 'local-content-saver',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/save-areas' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const jsonStr = JSON.stringify(data, null, 2);
              fs.writeFileSync(resolve(__dirname, 'public/data/areas.json'), jsonStr, 'utf-8');
              fs.writeFileSync(resolve(__dirname, 'data/areas.json'), jsonStr, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, message: 'Datos guardados exitosamente en areas.json' }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [localContentSaver()],
  server: {
    watch: {
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
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
});
