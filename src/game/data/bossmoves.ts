import { ELEMENTS, effectiveness } from './elements';
import { canLearnTM, TM_MOVES } from './items';
import { move, type MoveDef } from './moves';
import { species } from './species';

/**
 * A considered four-move set for a boss's Wildkin, chosen only from moves it
 * could legally know: its level-up moves up to its level (plus TM moves for
 * the league). The set holds its best same-type attack, the attack that best
 * covers what it is weak to, a second strong attack, and one status or setup
 * move when it has a good one.
 */
export function bossMoveset(sp: number, lvl: number, withTMs: boolean): string[] | null {
  const s = species(sp);
  const pool = new Set<string>(s.learn.filter(([l]) => l <= lvl).map(([, id]) => id));
  if (withTMs) for (const id of TM_MOVES) if (canLearnTM(s, id)) pool.add(id);
  const all = [...pool].map(move).filter(Boolean) as MoveDef[];
  if (all.length <= 4) return null;
  const stab = (m: MoveDef) => s.types.includes(m.type);
  const power = (m: MoveDef) => {
    const p = m.fixed ? (m.fixed === 'level' ? lvl : 50) : m.pow;
    const hits = m.multi ? (m.multi[0] + m.multi[1]) / 2 : 1;
    let v = p * hits * ((m.acc || 100) / 100) * (stab(m) ? 1.5 : 1);
    if (m.recharge) v *= 0.6;
    if (m.explode) v *= 0.15;
    if (m.recoil) v *= 0.85;
    if (m.drain) v *= 1.1;
    return v;
  };
  const attacks = all.filter((m) => m.cat !== 'status' && (m.pow > 0 || m.fixed)).sort((a, b) => power(b) - power(a));
  const picked: MoveDef[] = [];
  const add = (m: MoveDef | undefined) => {
    if (m && !picked.includes(m) && picked.length < 4) picked.push(m);
  };
  // 1. strongest same-type attack (or strongest attack)
  add(attacks.find(stab) ?? attacks[0]);
  // 2. coverage: hits the most types the first attack doesn't, weighted by power
  const covers = (m: MoveDef) => ELEMENTS.filter((e) => effectiveness(m.type, [e]) > 1 && !picked.some((p) => effectiveness(p.type, [e]) > 1)).length;
  const cov = attacks.filter((m) => !picked.some((p) => p.type === m.type)).sort((a, b) => power(b) * (1 + covers(b) / 3) - power(a) * (1 + covers(a) / 3))[0];
  add(cov);
  // 3. a status or setup move worth a turn
  const statusScore = (m: MoveDef) => {
    if (m.cat !== 'status') return 0;
    const acc = (m.acc || 100) / 100;
    if (m.status?.s === 'SLP') return 90 * acc;
    if (m.status?.s === 'PAR') return 75 * acc;
    if (m.status?.s === 'TOX') return 65 * acc;
    if (m.stat && m.stat.who === 'self' && m.stat.delta >= 2) return 70;
    if (m.status?.s === 'PSN' || m.status?.s === 'BRN') return 50 * acc;
    if (m.heal || m.rest) return 55;
    if (m.screen) return 45;
    if (m.stat && m.stat.who === 'self' && m.stat.delta > 0) return 40;
    if (m.conf) return 35 * acc;
    return 0;
  };
  const util = all.filter((m) => statusScore(m) >= 40).sort((a, b) => statusScore(b) - statusScore(a))[0];
  add(util);
  // 4. fill with the strongest remaining attacks, preferring new types
  for (const m of attacks) if (!picked.some((p) => p.type === m.type)) add(m);
  for (const m of attacks) add(m);
  if (picked.length < 4) for (const m of all) add(m);
  return picked.map((m) => m.id);
}
