import { launch, start, top, press, wait, shot } from './lib.mjs';
const { browser, page, errors } = await launch();
await start(page, { map: 'riverton', x: 8, y: 17, party: [['Skywyrm', 55], ['Thornhare', 40]], badges: ['BOULDER','RIPPLE','SPARK','BLOOM'], patch: { surfing: false } });
await shot(page, 'ui_overworld');
await press(page, 'start'); await wait(300); await shot(page, 'ui_menu');
await press(page, 'down'); await press(page, 'down'); await press(page, 'down'); await press(page, 'a'); await wait(300); await shot(page, 'ui_journal');
await press(page, 'b'); await wait(200);
await press(page, 'up'); await press(page, 'up'); await press(page, 'up'); await press(page, 'a'); await wait(300);
for (let i = 0; i < 24; i++) await press(page, 'down', 30);
await shot(page, 'ui_dexlist');
await press(page, 'b'); await press(page, 'b'); await wait(300);
await page.evaluate(() => { const g = window.__wildkin; const ow = g.scenes.find((s) => s.constructor.name === 'Overworld'); ow.run(async (c) => { await c.wild(146, 50); }); });
for (let i = 0; i < 30; i++) { await wait(150); }
await press(page, 'a'); await wait(1500); await press(page, 'a'); await wait(1500);
await shot(page, 'ui_battle');
await press(page, 'a'); await wait(300); await shot(page, 'ui_moves');
console.log(errors);
await browser.close();
