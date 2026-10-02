import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

/**
 * Custom Vite plugin to handle /api/sightings endpoints.
 * Allows web client to fetch, save, and clear public/data/sightings.json directly on disk.
 */
function sightingsApiPlugin(): Plugin {
  const sightingsFile = path.resolve(__dirname, 'public/data/sightings.json');
  const distSightingsFile = path.resolve(__dirname, 'dist/data/sightings.json');

  const writeSightings = (data: any[]) => {
    const content = JSON.stringify(data, null, 2) + '\n';
    fs.mkdirSync(path.dirname(sightingsFile), { recursive: true });
    fs.writeFileSync(sightingsFile, content, 'utf8');
    if (fs.existsSync(path.dirname(distSightingsFile))) {
      try {
        fs.writeFileSync(distSightingsFile, content, 'utf8');
      } catch {
        // ignore if dist directory not present
      }
    }
  };

  const handler = (req: any, res: any, next: any) => {
    const rawUrl = req.url || '';
    const cleanUrl = rawUrl.split('?')[0];

    // Clear sightings endpoint: POST /api/sightings/clear or DELETE /api/sightings
    if (
      (cleanUrl === '/api/sightings/clear' && (req.method === 'POST' || req.method === 'DELETE')) ||
      (cleanUrl === '/api/sightings' && req.method === 'DELETE')
    ) {
      try {
        writeSightings([]);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, message: 'public/data/sightings.json cleared', count: 0 }));
        return;
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: String(err) }));
        return;
      }
    }

    // Save/update sightings endpoint: POST /api/sightings
    if (cleanUrl === '/api/sightings' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (Array.isArray(parsed)) {
            writeSightings(parsed);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, count: parsed.length }));
            return;
          }
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Body must be a JSON array of sightings' }));
        } catch (e) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        }
      });
      return;
    }

    // Fetch sightings endpoint: GET /api/sightings (always returns latest file from disk, no-cache)
    if (cleanUrl === '/api/sightings' && req.method === 'GET') {
      try {
        if (fs.existsSync(sightingsFile)) {
          const content = fs.readFileSync(sightingsFile, 'utf8');
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.statusCode = 200;
          res.end(content);
          return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end('[]');
        return;
      } catch (e) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: String(e) }));
        return;
      }
    }

    next();
  };

  return {
    name: 'sightings-api-plugin',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), sightingsApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api/birdfy-nvts': {
          target: 'https://api2.nvts.co',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/birdfy-nvts/, ''),
        },
      },
    },
  };
});
