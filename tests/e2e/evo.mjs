import { launch, start, top, press, wait, idle } from './lib.mjs';
const { browser, page, errors } = await launch();
await start(page, { map: 'route1', x: 9, y: 10, party: [['Emberkit', 15]] });
await page.evaluate(() => { const m = window.__wildkin.state.party[0]; m.exp = m.exp + 3000; });
await page.evaluate(() => { const ow = window.__wildkin.scenes.at(-1); ow.run(async (c) => { await c.wild(16, 5); }); });
const seen = new Set();
for (let i = 0; i < 400; i++) {
  const t = await top(page); seen.add(t);
  if (t === 'Overworld' && await idle(page)) break;
  if (t === 'BattleScene') {
    const u = await page.evaluate(() => { const b = window.__wildkin.scenes.at(-1); return { k: b.ui?.kind, lv: [...(b.leveled ?? [])].length, txt: b.ui?.pages?.[b.ui.page]?.join(' ') }; });
    if (u.txt && !seen.has(u.txt)) { seen.add(u.txt); console.log('msg', u.txt, u.lv); }
    if (u.k === 'cmd') { await page.evaluate(() => { window.__wildkin.scenes.at(-1).cmdIdx = 0; }); }
    if (u.k === 'yesno') { const pr = await page.evaluate(() => (window.__wildkin.scenes.at(-1).ui.prompt||[]).join(' ')); if (/Stop learning/i.test(pr)) { await page.evaluate(() => { window.__wildkin.scenes.at(-1).ui.idx = 0; }); await press(page, 'a', 40); } else await press(page, 'b', 40); continue; }
  }
  await press(page, 'a', 30);
}
console.log([...seen].filter(x=>!x.includes(' ')), await page.evaluate(() => window.__wildkin.state.party[0].sp), errors);
await browser.close();
