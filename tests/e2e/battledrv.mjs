import { press, wait, top, idle } from './lib.mjs';
/** Drive the battle UI with a policy: policy(state) -> { cmd, move, item } */
export async function drive(page, policy, max = 900) {
  const log = [];
  for (let i = 0; i < max; i++) {
    const t = await top(page);
    if (t === 'Overworld' && (await idle(page))) return { log, end: 'overworld' };
    if (t === 'BattleScene') {
      const ui = await page.evaluate(() => { const b = window.__wildkin.scenes.at(-1); return { kind: b.ui?.kind, foeHp: b.foe?.mon?.hp, foeSp: b.foe?.mon?.sp, meHp: b.me?.mon?.hp }; });
      if (ui.kind === 'cmd') {
        const p = policy(ui);
        log.push(p.cmd);
        await page.evaluate((k) => { window.__wildkin.scenes.at(-1).cmdIdx = k; }, p.cmd);
        await press(page, 'a', 40);
        continue;
      }
      if (ui.kind === 'move') { const p = policy(ui); await page.evaluate((k) => { window.__wildkin.scenes.at(-1).moveIdx = k; }, p.move ?? 0); await press(page, 'a', 40); continue; }
      if (ui.kind === 'yesno') { const pr = await page.evaluate(() => (window.__wildkin.scenes.at(-1).ui.prompt||[]).join(' ')); if (/Stop learning/i.test(pr)) { await page.evaluate(() => { window.__wildkin.scenes.at(-1).ui.idx = 0; }); await press(page, 'a', 40); } else await press(page, 'b', 40); continue; }
      await press(page, 'a', 30);
      continue;
    }
    if (t === 'BagScene') {
      const p = policy({ kind: 'bag' });
      const k = await page.evaluate((id) => { const b = window.__wildkin.scenes.at(-1); return b.entries().findIndex((e) => e[0] === id); }, p.item);
      if (k < 0) { await press(page, 'b', 40); continue; }
      await page.evaluate((k) => { window.__wildkin.scenes.at(-1).idx = k; }, k);
      await press(page, 'a', 40); await wait(80);
      if (await page.evaluate(() => !!window.__wildkin.scenes.at(-1).sub)) { await page.evaluate(() => { window.__wildkin.scenes.at(-1).sub.idx = 0; }); await press(page, 'a', 40); }
      continue;
    }
    if (t === 'NamingScene') { await press(page, 'start', 40); await press(page, 'b', 40); continue; }
    if (t === 'ChoiceScene') { await press(page, 'b', 40); continue; }
    await press(page, 'a', 30);
  }
  return { log, end: 'timeout:' + (await top(page)) };
}
