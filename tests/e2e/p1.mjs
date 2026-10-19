// Autosave and crash-recovery tests. Run against a build served on BASE (default :4175).
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';

const BASE = process.env.BASE || 'http://localhost:4175/';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const res = [];
const ok = (n, c, d = '') => {
  res.push(`${c ? 'PASS' : 'FAIL'} ${n}${c ? '' : ' :: ' + d}`);
};
const SAVE = 'wildkin-ember-save-v2';

async function fresh(ctxOpts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 480, height: 700 }, ...ctxOpts });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(BASE);
  await page.waitForFunction(() => window.__wildkinDebug && window.__wildkin);
  return { ctx, page, errs };
}
const ev = (page, f, a) => page.evaluate(f, a);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const top = (page) => ev(page, () => window.__wildkin.scenes.at(-1).constructor.name);
const saved = (page) => ev(page, (k) => JSON.parse(localStorage.getItem(k) || 'null'), SAVE);
async function press(page, key, ms = 70) {
  await page.keyboard.down(key);
  await wait(ms);
  await page.keyboard.up(key);
  await wait(60);
}
async function mash(page, until, max = 80) {
  for (let i = 0; i < max; i++) {
    if (await until()) return true;
    await press(page, 'KeyZ', 50);
  }
  return until();
}
const start = (page, o) => ev(page, (o) => window.__wildkinDebug.start(o), o);

// ---------------------------------------------------------------- autosave
{
  const { ctx, page, errs } = await fresh();
  await start(page, { map: 'route1', x: 9, y: 20, party: [['Emberkit', 12]] });
  await wait(600);
  let s = await saved(page);
  ok('autosaves as soon as play is idle', s && s.map === 'route1' && s.y === 20, JSON.stringify(s && [s.map, s.x, s.y]));
  const notice = await ev(page, () => window.__wildkin.autosave.notice);
  ok('shows a SAVED badge', notice && notice.kind === 'saved', JSON.stringify(notice));

  // moving a few steps does not save immediately (no milestone, same map)
  await press(page, 'ArrowUp', 300);
  await wait(400);
  s = await saved(page);
  ok('no save spam for ordinary steps', s.y === 20, 'y=' + s.y);

  // page hidden: flush saves the latest safe position
  await ev(page, () => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  s = await saved(page);
  const live = await ev(page, () => [window.__wildkin.state.x, window.__wildkin.state.y]);
  ok('saves when the tab is hidden', s.y === live[1] && s.y < 20, `saved ${s.y} live ${live[1]}`);
  await ev(page, () => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });

  // milestone: picking up an item saves right away once idle
  await start(page, { map: 'route1', x: 16, y: 8, party: [['Emberkit', 12]] });
  await wait(400);
  await press(page, 'ArrowUp', 40);
  await mash(page, async () => (await top(page)) === 'Overworld' && (await ev(page, () => !!window.__wildkin.state.flags['item:r1potion'])), 20);
  await mash(page, async () => (await top(page)) === 'Overworld', 20);
  await wait(300);
  s = await saved(page);
  ok('saves right after a milestone (item picked up)', s && s.flags['item:r1potion'], JSON.stringify(s && Object.keys(s.flags).slice(-3)));

  // never during a battle
  const before = (await saved(page)).savedAt;
  await ev(page, () => {
    const ow = window.__wildkin.scenes[0];
    void ow.run(async (c) => {
      await c.wild(16, 3);
    });
  });
  await wait(300);
  for (let i = 0; i < 8; i++) await press(page, 'KeyZ', 40);
  const inBattle = (await top(page)) !== 'Overworld';
  const during = (await saved(page)).savedAt;
  ok('no autosave while a battle is open', inBattle && during === before, `top ${await top(page)} ${before} ${during}`);
  // finish battle by running
  for (let i = 0; i < 60 && (await top(page)) !== 'Overworld'; i++) {
    const kind = await ev(page, () => window.__wildkin.scenes.at(-1).ui?.kind);
    if (kind === 'cmd') {
      await press(page, 'ArrowDown');
      await press(page, 'ArrowRight');
    }
    await press(page, 'KeyZ', 40);
  }
  await wait(400);
  ok('battle ends back in the overworld', (await top(page)) === 'Overworld', await top(page));

  // reload restores the autosave via CONTINUE
  const want = await saved(page);
  await page.reload();
  await page.waitForFunction(() => window.__wildkinDebug && window.__wildkin);
  await mash(page, async () => (await top(page)) === 'Overworld', 30);
  await wait(500);
  const back = await ev(page, () => ({ map: window.__wildkin.state.map, x: window.__wildkin.state.x, y: window.__wildkin.state.y }));
  ok('reload + CONTINUE resumes from the autosave', back.map === want.map && back.x === want.x && back.y === want.y, JSON.stringify([back, want.map, want.x, want.y]));
  ok('no page errors (autosave flow)', errs.length === 0, errs.join(' | '));
  await ctx.close();
}

// browser closed and reopened: new context with the same storage
{
  const { ctx, page } = await fresh();
  await start(page, { map: 'brindle', x: 10, y: 12, party: [['Emberkit', 12]] });
  await wait(500);
  const storage = await ctx.storageState();
  await ctx.close();
  const ctx2 = await browser.newContext({ storageState: storage, viewport: { width: 480, height: 700 } });
  const p2 = await ctx2.newPage();
  await p2.goto(BASE);
  await p2.waitForFunction(() => window.__wildkinDebug && window.__wildkin);
  await mash(p2, async () => (await top(p2)) === 'Overworld', 30);
  await wait(400);
  const st = await ev(p2, () => [window.__wildkin.state.map, window.__wildkin.state.x, window.__wildkin.state.y]);
  ok('progress survives closing and reopening the browser', st[0] === 'brindle' && st[1] === 10 && st[2] === 12, JSON.stringify(st));
  await ctx2.close();
}

// storage failure is reported and never crashes
{
  const { ctx, page, errs } = await fresh();
  await ev(page, () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === 'wildkin-ember-save-v2') throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      return orig.call(this, k, v);
    };
  });
  await start(page, { map: 'route1', x: 9, y: 20, party: [['Emberkit', 12]] });
  await wait(600);
  const n = await ev(page, () => window.__wildkin.autosave.notice);
  const t = await ev(page, () => {
    const sc = window.__wildkin.scenes.at(-1);
    return sc.pages ? sc.pages.flat().join(' ') : sc.constructor.name;
  });
  ok('failed autosave shows SAVE FAILED', n && n.kind === 'failed', JSON.stringify(n));
  ok('failed autosave explains progress is not being saved', /NOT being saved/.test(t), t);
  ok('no crash on storage failure', errs.length === 0 && !(await ev(page, () => window.__wildkin.crashed)), errs.join('|'));
  await ctx.close();
}

// autosave off
{
  const { ctx, page } = await fresh();
  await ev(page, () => window.__wildkin.setOptions({ autosave: false }));
  await start(page, { map: 'route1', x: 9, y: 20, party: [['Emberkit', 12]] });
  await wait(600);
  ok('AUTOSAVE OFF writes nothing', (await saved(page)) === null);
  await ctx.close();
}

// old saves (made before autosave existed) still load, and manual SAVE still works
{
  const { ctx, page } = await fresh();
  await start(page, { map: 'riverton', x: 8, y: 17, party: [['Emberkit', 20]] });
  await wait(300);
  const legacy = await ev(page, () => {
    const s = JSON.parse(JSON.stringify(window.__wildkin.state));
    delete s.surfing;
    s.savedAt = 1700000000000;
    return s;
  });
  await ev(page, ([k, s]) => {
    localStorage.setItem(k, JSON.stringify(s));
    localStorage.removeItem('wildkin-ember-options-v1');
  }, [SAVE, legacy]);
  await page.reload();
  await page.waitForFunction(() => window.__wildkinDebug && window.__wildkin);
  await mash(page, async () => (await top(page)) === 'Overworld', 30);
  const st = await ev(page, () => window.__wildkin.state.map);
  ok('an older save loads with CONTINUE', st === 'riverton', st);
  ok('autosave defaults to ON for players with old options', await ev(page, () => window.__wildkin.options.autosave === true));
  // manual save through the menu
  await wait(300);
  await press(page, 'KeyM');
  const items = await ev(page, () => window.__wildkin.scenes.at(-1).items());
  const k = items.indexOf('SAVE');
  for (let i = 0; i < k; i++) await press(page, 'ArrowDown');
  await press(page, 'KeyZ');
  await wait(200);
  await press(page, 'KeyZ'); // YES
  await mash(page, async () => (await top(page)) === 'StartMenu', 20);
  const s2 = await saved(page);
  ok('manual SAVE from the menu still works', s2 && s2.savedAt > 1700000000000, String(s2 && s2.savedAt));
  await press(page, 'KeyX');
  await ctx.close();
}

// new game with an existing save asks first
{
  const { ctx, page } = await fresh();
  await start(page, { map: 'brindle', x: 10, y: 12, party: [['Emberkit', 12]] });
  await wait(500);
  await page.reload();
  await page.waitForFunction(() => window.__wildkinDebug && window.__wildkin);
  await press(page, 'KeyZ'); // press start -> menu
  await wait(200);
  const items = await ev(page, () => window.__wildkin.scenes.at(-1).menuItems());
  for (let i = 0; i < items.indexOf('NEW GAME'); i++) await press(page, 'ArrowDown');
  await press(page, 'KeyZ');
  await mash(page, async () => (await top(page)) === 'ChoiceScene', 6);
  const prompt = await ev(page, () => window.__wildkin.scenes.at(-1).lines?.join(' '));
  ok('NEW GAME over a save asks for confirmation', /replace it/.test(prompt || ''), prompt);
  await press(page, 'KeyX'); // B = NO
  await wait(300);
  ok('declining keeps the title and the save', (await top(page)) === 'TitleScene' && (await saved(page)).map === 'brindle', await top(page));
  await ctx.close();
}

// ---------------------------------------------------------------- crash recovery
{
  const { ctx, page } = await fresh();
  await start(page, { map: 'route1', x: 9, y: 20, party: [['Emberkit', 12]], patch: { name: 'ZORBA' } });
  await wait(500);
  const savedBefore = (await saved(page)).savedAt;
  await ev(page, () => window.__wildkinDebug.crash('script'));
  await mash(page, async () => {
    const sc = await ev(page, () => {
      const s = window.__wildkin.scenes.at(-1);
      return s.pages ? s.pages.flat().join(' ') : '';
    });
    return /went wrong/.test(sc);
  }, 10);
  const msg = await ev(page, () => {
    const s = window.__wildkin.scenes.at(-1);
    return s.pages ? s.pages.flat().join(' ') : s.constructor.name;
  });
  ok('event error is recovered with an honest message', /went wrong/.test(msg) && /paused/.test(msg), msg);
  await mash(page, async () => (await top(page)) === 'Overworld', 10);
  const y0 = await ev(page, () => window.__wildkin.state.y);
  await press(page, 'ArrowUp', 300);
  await wait(300);
  const y1 = await ev(page, () => window.__wildkin.state.y);
  ok('player can keep moving after recovery', y1 < y0, `${y0}->${y1}`);
  ok('autosave paused after an error', (await ev(page, () => window.__wildkin.autosave.paused)) === 'error' && (await saved(page)).savedAt === savedBefore);
  const log = await ev(page, () => JSON.parse(localStorage.getItem('wildkin-error-log') || '[]'));
  ok('error is recorded for diagnostics', log.length >= 1 && log.at(-1).where === 'script' && /Test script error/.test(log.at(-1).message), JSON.stringify(log.at(-1)));
  ok('diagnostics do not contain the player name', !JSON.stringify(log).includes('ZORBA'));

  // an update-loop error during a battle drops the battle
  await ev(page, () => {
    void window.__wildkin.scenes[0].run(async (c) => {
      await c.wild(16, 3);
    });
  });
  await wait(400);
  await ev(page, () => window.__wildkinDebug.crash('update'));
  await wait(300);
  const names = await ev(page, () => window.__wildkin.scenes.map((s) => s.constructor.name));
  ok('error inside a battle returns to the overworld', names[0] === 'Overworld' && !names.includes('BattleScene'), names.join(','));
  await mash(page, async () => (await top(page)) === 'Overworld', 10);
  ok('game still running after battle error', !(await ev(page, () => window.__wildkin.crashed)));

  // manual save resumes autosave
  await press(page, 'KeyM');
  const items = await ev(page, () => window.__wildkin.scenes.at(-1).items());
  for (let i = 0; i < items.indexOf('SAVE'); i++) await press(page, 'ArrowDown');
  await press(page, 'KeyZ');
  await wait(200);
  await press(page, 'KeyZ');
  await mash(page, async () => (await top(page)) === 'StartMenu', 20);
  ok('manual save after an error resumes autosave', (await ev(page, () => window.__wildkin.autosave.paused)) === null);
  await press(page, 'KeyX');
  await ctx.close();
}

// repeated errors -> crash screen; reload goes back to the last real save
{
  const { ctx, page } = await fresh();
  await start(page, { map: 'brindle', x: 10, y: 12, party: [['Emberkit', 12]] });
  await wait(500);
  const real = await saved(page);
  // move without saving, then crash for good
  await press(page, 'ArrowLeft', 300);
  await ev(page, () => window.__wildkinDebug.crash('fatal'));
  await page.waitForSelector('.crash', { timeout: 5000 }).catch(() => {});
  const visible = await page.isVisible('.crash');
  const text = visible ? await page.innerText('.crash') : '';
  ok('unrecoverable error shows the crash screen', visible, 'no .crash');
  ok('crash screen names the last save honestly', /last save is safe/i.test(text) && /BRINDLE/i.test(text) && /not saved/i.test(text), text);
  ok('game loop stops on crash', await ev(page, () => window.__wildkin.crashed));
  await page.screenshot({ path: new URL('./shots/crash_screen.png', import.meta.url).pathname });
  await page.click('text=RELOAD LAST SAVE');
  await page.waitForFunction(() => window.__wildkinDebug && window.__wildkin);
  await mash(page, async () => (await top(page)) === 'Overworld', 30);
  await wait(300);
  const st = await ev(page, () => [window.__wildkin.state.map, window.__wildkin.state.x, window.__wildkin.state.y]);
  ok('reload resumes exactly the last real save', st[0] === real.map && st[1] === real.x && st[2] === real.y, JSON.stringify([st, real.x, real.y]));
  await ctx.close();
}

// error on the title screen (nothing to recover to)
{
  const { ctx, page } = await fresh();
  await ev(page, () => localStorage.clear());
  await ev(page, () => window.__wildkinDebug.crash('update'));
  await page.waitForSelector('.crash', { timeout: 5000 }).catch(() => {});
  const text = (await page.isVisible('.crash')) ? await page.innerText('.crash') : '';
  ok('error outside the overworld shows the crash screen', /no saved game/i.test(text), text);
  await ctx.close();
}

// async error is recovered too
{
  const { ctx, page } = await fresh();
  await start(page, { map: 'route1', x: 9, y: 20, party: [['Emberkit', 12]] });
  await wait(400);
  await ev(page, () => window.__wildkinDebug.crash('async'));
  await wait(400);
  ok('stray async error is recovered without crashing', !(await ev(page, () => window.__wildkin.crashed)) && (await ev(page, () => window.__wildkin.autosave.paused)) === 'error');
  await ctx.close();
}

console.log(res.join('\n'));
console.log(res.filter((r) => r.startsWith('FAIL')).length, 'failed of', res.length);
await browser.close();
