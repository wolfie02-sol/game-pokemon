// Offline build used in environments without npm registry access.
// Bundles the same sources Vite would, using the preinstalled esbuild + React.
import * as esbuild from '/opt/npm-tools/node_modules/esbuild/lib/main.js';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, 'dist-local');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'assets'), { recursive: true });
await esbuild.build({
  entryPoints: [path.join(root, 'src/main.tsx')],
  bundle: true,
  minify: process.argv.includes('--min'),
  sourcemap: true,
  format: 'esm',
  jsx: 'automatic',
  target: 'es2022',
  outdir: path.join(out, 'assets'),
  entryNames: 'index',
  nodePaths: ['/opt/npm-tools/node_modules'],
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'warning',
  keepNames: !process.argv.includes('--min'),
});
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace('<script type="module" src="/src/main.tsx"></script>', '<link rel="stylesheet" href="./assets/index.css" />\n    <script type="module" src="./assets/index.js"></script>');
fs.writeFileSync(path.join(out, 'index.html'), html);
console.log('built', out);
