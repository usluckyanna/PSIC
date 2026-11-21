import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import chat from '../api/chat.mjs';

const assets = new Map([
  ['/', ['index.html', 'text/html']],
  ['/app.js', ['app.js', 'text/javascript']],
  ['/data.js', ['data.js', 'text/javascript']],
  ['/languages.mjs', ['languages.mjs', 'text/javascript']],
  ['/style.css', ['style.css', 'text/css']],
]);

createServer(async (req, res) => {
  const path = req.url.split('?')[0];
  if (path === '/api/chat') return chat(req, res);
  const asset = assets.get(path);
  if (!asset || !['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(404).end('Not found');
    return;
  }
  const [file, type] = asset;
  try {
    const body = await readFile(new URL(`../public/${file}`, import.meta.url));
    res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(500).end('Could not load the page');
  }
}).listen(3000, '127.0.0.1', () => console.log('WorkGuide is running at http://127.0.0.1:3000'));
