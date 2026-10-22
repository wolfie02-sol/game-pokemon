import { TRAINERS } from '../data/trainers';
import { rematchTeam, strongestLevel, type CardHooks } from '../systems/cardbosses';
import type { ScriptCtx } from './types';

const errText = (e: unknown) => (e instanceof Error && e.message ? e.message : 'The card rewards server could not be reached.');

function hoursText(sec: number): string {
  const h = Math.ceil(sec / 3600);
  return h <= 1 ? 'less than an hour' : `about ${h} hours`;
}

/**
 * A rematch against a beaten leader for a chance at a real card. Returns false
 * if no battle happened (so the caller can fall back to the leader's usual line).
 */
export async function cardChallenge(c: ScriptCtx, trainerId: string, cards: CardHooks): Promise<boolean> {
  const base = TRAINERS[trainerId];
  const level = strongestLevel(c.s);

  let pv: Awaited<ReturnType<CardHooks['preview']>>;
  try {
    pv = await cards.preview(trainerId, level);
  } catch (e) {
    await c.say(errText(e));
    return false;
  }
  if (!pv.eligible) {
    await c.say(`CARD CHALLENGES need at least ${pv.need.toLocaleString('en-US')} tokens in your connected wallet.`);
    return true;
  }
  if (pv.left <= 0) {
    await c.say(`${base.name}: You've fought all ${pv.limit} card battles for today. Come back in ${hoursText(pv.resetsInSec)}.`);
    return true;
  }

  await c.say(`${base.name}: Back for a CARD CHALLENGE? My team has trained to match yours.`);
  const yes = await c.yesNo(`Battle for a ${pv.odds}% chance at a real card? (${pv.left} of ${pv.limit} card battles left today)`);
  if (!yes) {
    await c.say(`${base.name}: Whenever you're ready.`);
    return true;
  }

  let battleId: number;
  try {
    battleId = (await cards.start(trainerId, level)).battleId;
  } catch (e) {
    await c.say(errText(e));
    return true;
  }

  const id = 'card:' + trainerId;
  TRAINERS[id] = {
    ...base,
    id,
    team: rematchTeam(typeof base.team === 'function' ? base.team(c.s) : base.team, level, trainerId),
    intro: `${base.name}: Show me everything you've got!`,
    lose: `${base.name}: You earned that win.`,
    after: '',
    music: 'boss',
    smart: true,
  };
  const won = await c.battle(id);

  let result: { won: boolean; card?: string; note?: string } = { won: false };
  try {
    result = await cards.finish(battleId, won);
  } catch (e) {
    if (won) await c.say(errText(e));
    return true;
  }
  if (!won) return true; // the usual blackout already happened
  if (result.won) {
    await c.say([`${base.name}: Incredible. You've earned this.`, `{PLAYER} won ${result.card ?? 'a real card'}! Check CARD REWARDS to follow it.`]);
  } else {
    await c.say(`${base.name}: Well fought! No card this time. Try again soon.`);
  }
  return true;
}
