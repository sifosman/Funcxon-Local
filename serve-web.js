// Minimal SPA static file server for the Expo web export (dist/).
// Handles the vercel.json rewrite (unknown routes -> /index.html) and
// correct MIME types, using only Node built-ins (no npm install).
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, 'dist');
const PORT = Number(process.env.PORT || 8080);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  let filePath = path.join(ROOT, urlPath);

  // Prevent path traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    // SPA fallback: if the file doesn't exist and it's not an asset path,
    // serve index.html (mirrors vercel.json rewrite).
    if (err || !stats.isFile()) {
      const ext = path.extname(filePath);
      // If the requested path has no file extension OR is not a tracked asset
      // path, treat it as an SPA route and serve index.html (vercel.json rewrite).
      // Asset directories (/assets, /_expo) 404 normally when the file is missing.
      if (ext === '' || ext === '.html') {
        filePath = path.join(ROOT, 'index.html');
      } else if (!urlPath.startsWith('/assets/') && !urlPath.startsWith('/_expo/')) {
        filePath = path.join(ROOT, 'index.html');
      } else {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`SPA server running at http://127.0.0.1:${PORT}/ (root: ${ROOT})`);
});
