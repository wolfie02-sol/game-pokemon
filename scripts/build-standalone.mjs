// Builds a single self-contained index.html (JS and CSS inlined) for static hosting.
// Usage: node scripts/build-standalone.mjs  -> dist-standalone/index.html
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
execFileSync(process.execPath, [path.join(root, 'scripts/build-local.mjs'), '--min'], { stdio: 'inherit' });

const strip = (x) =>
  x
    .replace(/\n?\/\/# sourceMappingURL=.*\s*$/, '')
    .replace(/\n?\/\*# sourceMappingURL=.*?\*\/\s*$/, '')
    .replace(/\n+$/, '') + '\n\n';

const js = strip(fs.readFileSync(path.join(root, 'dist-local/assets/index.js'), 'utf8')).replace(/<\/script/gi, '<\\/script');
const css = strip(fs.readFileSync(path.join(root, 'dist-local/assets/index.css'), 'utf8'));
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const tag = '<script type="module" src="/src/main.tsx"></script>';
if (!html.includes(tag)) throw new Error('index.html entry script tag not found');
html = html.replace(tag, () => `<style>${css}</style>\n    <script type="module">${js}</script>`);

const out = path.join(root, 'dist-standalone');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), html);
console.log('standalone', path.join(out, 'index.html'), (html.length / 1024).toFixed(0) + ' KB');
