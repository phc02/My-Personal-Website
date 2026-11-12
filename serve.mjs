import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {pipeline} from 'node:stream/promises';
import {resolve, extname, dirname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), 'dist');
const port = Number(process.env.PORT || 4173);
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json; charset=utf-8','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.mp4':'video/mp4','.webm':'video/webm','.txt':'text/plain; charset=utf-8'};
createServer(async (req, res) => {
  try {
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405, {Allow:'GET, HEAD'}).end(); return; }
    const url = new URL(req.url, 'http://localhost');
    let pathname; try { pathname = decodeURIComponent(url.pathname); } catch { res.writeHead(400).end(); return; }
    const file = resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    const info = await stat(file); if (!info.isFile()) { res.writeHead(404).end(); return; }
    const etag = `"${info.size.toString(16)}-${Math.trunc(info.mtimeMs).toString(16)}"`;
    const headers = {'Content-Type':mime[extname(file).toLowerCase()] || 'application/octet-stream','Accept-Ranges':'bytes',ETag:etag,'Last-Modified':info.mtime.toUTCString(),'Cache-Control':file.endsWith('.html') ? 'no-cache' : file.includes(sep+'generated'+sep) ? 'public, max-age=31536000, immutable' : 'public, max-age=3600, must-revalidate'};
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers).end(); return; }
    let start = 0, end = info.size - 1, status = 200;
    if (req.headers.range && (!req.headers['if-range'] || req.headers['if-range'] === etag)) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (!match || (!match[1] && !match[2])) { res.writeHead(416, {...headers,'Content-Range':`bytes */${info.size}`}).end(); return; }
      if (!match[1]) start = Math.max(0, info.size - Number(match[2]));
      else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
      if (start > end || start >= info.size) { res.writeHead(416, {...headers,'Content-Range':`bytes */${info.size}`}).end(); return; }
      status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
    }
    headers['Content-Length'] = info.size ? end - start + 1 : 0;
    res.writeHead(status, headers);
    if (req.method === 'HEAD' || !info.size) { res.end(); return; }
    await pipeline(createReadStream(file, {start, end}), res);
  } catch (error) {
    if (!res.headersSent) res.writeHead(error.code === 'ENOENT' ? 404 : 500).end('Not found');
    else if (!res.destroyed) res.destroy();
  }
}).listen(port, '127.0.0.1', () => console.log(`Portfolio preview: http://localhost:${port}`));
