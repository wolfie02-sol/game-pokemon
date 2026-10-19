// Runs the playthrough bot against a local build.
// Usage: node tests/bot/run.mjs [--continue] [--starter EMBERKIT] [--chunk 30000] [--max 50000000] [--out dir]
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf('--' + k);
  return i >= 0 ? args[i + 1] : d;
};
const cont = args.includes('--continue');
const chunk = Number(opt('chunk', 30000));
const maxFrames = Number(opt('max', 60_000_000));
const out = opt('out', new URL('./out', import.meta.url).pathname);
const url = opt('url', 'http://localhost:4173/');
const userDir = path.join(out, 'profile');
fs.mkdirSync(out, { recursive: true });
if (!cont) fs.rmSync(userDir, { recursive: true, force: true });

const ctx = await chromium.launchPersistentContext(userDir, { executablePath: '/opt/pw-browsers/chromium', viewport: { width: 480, height: 640 } });
const page = ctx.pages()[0] ?? (await ctx.newPage());
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
const botSrc = fs.readFileSync(new URL('./bot.js', import.meta.url), 'utf8');

async function boot(continueSave) {
  await page.goto(url);
  await page.waitForFunction(() => window.__wildkinDebug && window.__wildkin);
  if (!continueSave) await page.evaluate(() => localStorage.clear());
  if (!continueSave) {
    await page.reload();
    await page.waitForFunction(() => window.__wildkinDebug && window.__wildkin);
  }
  await page.addScriptTag({ content: botSrc });
  await page.evaluate(
    ([c, starter, policy]) => {
      window.__bot.opts.continue = c;
      if (starter) window.__bot.opts.starter = starter;
      window.__bot.opts.policy = policy;
    },
    [continueSave, opt('starter', 'EMBERKIT'), opt('policy', 'all')],
  );
}

const log = fs.createWriteStream(path.join(out, 'progress.log'), { flags: cont ? 'a' : 'w' });
const say = (t) => {
  console.log(t);
  log.write(t + '\n');
};
await boot(cont);
let total = 0;
let lastBadges = -1;
let bossSeen = 0;
let lastSum = null;
const t0 = Date.now();
while (total < maxFrames) {
  let timer;
  const hang = new Promise((r) => (timer = setTimeout(() => r('HANG'), 180000)));
  const sumOrHang = await Promise.race([page.evaluate((n) => window.__bot.run(n), chunk), hang]);
  clearTimeout(timer);
  if (sumOrHang === 'HANG') {
    // find out where the page is stuck
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Debugger.enable');
    const paused = new Promise((r) => cdp.once('Debugger.paused', r));
    await cdp.send('Debugger.pause');
    const ev = await paused;
    const frames = ev.callFrames.slice(0, 12).map((f) => `${f.functionName || '(anon)'} @ ${f.url.split('/').pop()}:${f.location.lineNumber + 1}:${f.location.columnNumber}`);
    say('HANG detected. Stack:\n  ' + frames.join('\n  '));
    fs.writeFileSync(path.join(out, 'hang.txt'), frames.join('\n'));
    break;
  }
  const sum = sumOrHang;
  total += chunk;
  lastSum = sum;
  const mins = ((Date.now() - t0) / 60000).toFixed(1);
  say(`${mins}m f=${sum.frames} ${sum.scene} ${sum.map}${JSON.stringify(sum.pos)} badges=${sum.badges.length} party=${sum.party.join(' ')} $${sum.money} dex=${sum.caught}/${sum.seen} goal=${sum.goal && sum.goal.type + ':' + sum.goal.key} idle=${sum.sinceProgress} issues=${sum.issues} W${sum.battles.won}`);
  for (const b of (sum.bossLog || []).slice(bossSeen)) say(`   BOSS ${b.id} b${b.badges} foe ${b.foe.join('/')} team ${b.team.join('/')} ${b.won ? 'WON' : 'LOST'} wild+${b.wildSince} grind+${b.grindSince}`);
  bossSeen = (sum.bossLog || []).length;
  if (sum.badges.length !== lastBadges) {
    lastBadges = sum.badges.length;
    await page.locator('canvas').first().screenshot({ path: path.join(out, `badge${lastBadges}.png`) });
  }
  if (total % (chunk * 20) === 0) {
    await page.locator('canvas').first().screenshot({ path: path.join(out, `last.png`) });
    const dump = await page.evaluate(() => ({ events: window.__bot.events, issues: window.__bot.issues, prompts: window.__bot.prompts, trace: window.__bot.trace }));
    fs.writeFileSync(path.join(out, 'bot.json'), JSON.stringify({ summary: lastSum, ...dump, pageErrors }, null, 1));
  }
  if (sum.done) break;
  if (opt('stop', '') === 'champion' && sum.champion) {
    say('Reached CHAMPION, stopping as asked');
    break;
  }
  const bm = /^badges(\d)$/.exec(opt('stop', ''));
  if (bm && (sum.badges?.length ?? 0) >= Number(bm[1])) {
    say(`Reached ${bm[1]} badge(s), stopping as asked`);
    break;
  }
  if (sum.sinceProgress > 4_000_000) {
    say('NO PROGRESS for 4M frames, stopping');
    break;
  }
}
await page.locator('canvas').first().screenshot({ path: path.join(out, `last.png`) });
const dump = await page.evaluate(() => ({ events: window.__bot.events, issues: window.__bot.issues, prompts: window.__bot.prompts, trace: window.__bot.trace, texts: [...window.__bot.texts] }));
fs.writeFileSync(path.join(out, 'bot.json'), JSON.stringify({ summary: lastSum, ...dump, pageErrors }, null, 1));
say('FINAL ' + JSON.stringify(lastSum));
await ctx.close();
