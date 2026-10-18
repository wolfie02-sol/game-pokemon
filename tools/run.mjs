// Bundle a TS entry for node and run it: node tools/run.mjs tools/datacheck.ts
import * as esbuild from '/opt/npm-tools/node_modules/esbuild/lib/main.js';
import { execFileSync } from 'node:child_process';
const entry = process.argv[2];
const out = '/tmp/claude-0/wk-' + entry.replace(/\W/g, '_') + '.mjs';
await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'warning', inject: ['tools/domstub.mjs'] });
try { execFileSync('node', [out, ...process.argv.slice(3)], { stdio: 'inherit' }); } catch (e) { process.exit(1); }
