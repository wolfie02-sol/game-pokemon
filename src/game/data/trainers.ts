import type { GameState } from '../systems/state';
import { SP } from './species';

export interface TrainerDef {
  id: string;
  cls: string;
  name: string;
  look: string;
  team: [number, number][] | ((s: GameState) => [number, number][]);
  /** prize money per level of the last Wildkin */
  money: number;
  intro: string;
  /** shown in battle when defeated */
  lose: string;
  /** overworld line after being defeated */
  after: string;
  music?: 'battle' | 'boss';
  smart?: boolean;
}

const RIVAL_PICK: Record<number, number> = { 1: SP.SPLASHEL, 4: SP.SPROUTLE, 7: SP.EMBERKIT };

export function rivalStarter(s: GameState): number {
  return RIVAL_PICK[s.starter] ?? SP.SPLASHEL;
}

const T = (t: TrainerDef) => t;

export const TRAINERS: Record<string, TrainerDef> = Object.fromEntries(
  [
    // ---- rival ----
    T({
      id: 'rival1', cls: 'RIVAL', name: '{RIVAL}', look: 'rival', money: 30,
      team: (s) => [[rivalStarter(s), 5]],
      intro: "Hold on! Let's see whose partner is stronger!", lose: 'What?! I picked the better one, I swear!',
      after: '', music: 'boss',
    }),
    T({
      id: 'rival2', cls: 'RIVAL', name: '{RIVAL}', look: 'rival', money: 40, smart: true,
      team: (s) => [[SP.FLUFFIN, 15], [SP.NIBBIT, 15], [rivalStarter(s) + 1, 18]],
      intro: "Took you long enough! I've been training nonstop. Show me what you've got!",
      lose: "Tch... you're getting good. Too good.", after: '', music: 'boss',
    }),
    T({
      id: 'rival3', cls: 'RIVAL', name: '{RIVAL}', look: 'rival', money: 60, smart: true,
      team: (s) => [[SP.SKYROOST, 33], [SP.GNAWLORD, 33], [SP.STORMANE, 34], [SP.SWAMPLASH, 34], [rivalStarter(s) + 2, 37]],
      intro: "So you made it all the way here. Only one of us walks into SUMMIT HALL. It's going to be me!",
      lose: "...Fine. You earned it. Go on. And don't you dare lose up there.", after: '', music: 'boss',
    }),
    // ---- route 1 ----
    T({ id: 'r1_pip', cls: 'YOUNGSTER', name: 'PIP', look: 'youngster', money: 15, team: [[SP.NIBBIT, 4], [SP.NIBBIT, 4]],
      intro: 'Hey! You looked at me! That means we battle!', lose: 'My Nibbits! Noooo!', after: 'I should train in the tall grass more.' }),
    // ---- route 2 ----
    T({ id: 'r2_tess', cls: 'CAMPER', name: 'TESS', look: 'girl', money: 20, team: [[SP.THORNET, 7], [SP.FLUFFIN, 8]],
      intro: "I've camped out here for days. Battle me!", lose: 'My tent is safer than my strategy.', after: 'Thornet like the bushes around here.' }),
    T({ id: 'r2_mina', cls: 'LASS', name: 'MINA', look: 'lass', money: 18, team: [[SP.SPOREKIN, 8], [SP.GLIMMOTH, 9]],
      intro: 'Aren\'t my Wildkin adorable? They\'re tough too!', lose: 'Adorable AND defeated...', after: 'Glimmoth sparkle at night. So pretty.' }),
    T({ id: 'r2_dale', cls: 'BUG FAN', name: 'DALE', look: 'boy', money: 16, team: [[SP.THORNET, 8], [SP.THORNET, 8], [SP.THORNET, 9]],
      intro: 'Thornet are the best! I have three!', lose: 'Maybe I need a fourth.', after: 'The cave ahead is full of Pebbit.' }),
    // ---- whisper cave ----
    T({ id: 'cv_bram', cls: 'HIKER', name: 'BRAM', look: 'hiker', money: 28, team: [[SP.PEBBIT, 10], [SP.PEBBIT, 11]],
      intro: 'These caves are my second home! Battle!', lose: 'Rock-solid loss.', after: 'Watch your step. Things glitter in these walls.' }),
    T({ id: 'cv_grunt1', cls: 'HOLLOW', name: 'GRUNT', look: 'grunt', money: 25, team: [[SP.WISPET, 11], [SP.SPOREKIN, 11]],
      intro: "The HOLLOW ORDER is busy here. Scram, kid!", lose: 'Ugh! The admin won\'t like this...', after: "We're just... collecting rocks. Yeah." }),
    T({ id: 'cv_grunt2', cls: 'HOLLOW', name: 'GRUNT', look: 'grunt', money: 25, team: [[SP.NIBBIT, 11], [SP.WISPET, 12]],
      intro: 'No snooping! These Glow Crystals are ours!', lose: 'Lost to a kid! Again!', after: 'The crystals glow brighter near the Ember Core... oops.' }),
    T({ id: 'cv_sable', cls: 'ADMIN', name: 'SABLE', look: 'sable', money: 45, smart: true,
      team: [[SP.WISPET, 13], [SP.SPOREKIN, 13], [SP.FUNGRAVE, 15]],
      intro: 'A child, wandering into the HOLLOW ORDER\'s dig? How tiresome. Let me teach you some manners.',
      lose: 'Hmph. Enough. We have what we came for.', after: '', music: 'boss' }),
    // ---- route 3 ----
    T({ id: 'r3_finn', cls: 'SAILOR', name: 'FINN', look: 'sailor', money: 30, team: [[SP.MUDGILL, 13], [SP.MUDGILL, 14]],
      intro: 'Ahoy! Bridges are for battling!', lose: 'Sunk like an anchor!', after: 'Mudgill crawl out of the lake at dusk.' }),
    T({ id: 'r3_rue', cls: 'LASS', name: 'RUE', look: 'lass', money: 22, team: [[SP.GLIMMOTH, 14], [SP.ZAPLING, 14]],
      intro: 'The breeze on this bridge is perfect for a battle!', lose: 'Blown away...', after: 'CINDERMOOR is just north of here.' }),
    T({ id: 'r3_kip', cls: 'FISHER', name: 'KIP', look: 'hiker', money: 28, team: [[SP.MUDGILL, 13], [SP.MUDGILL, 13], [SP.SWAMPLASH, 15]],
      intro: 'You scared the fish away! Now you owe me a battle!', lose: 'The one that got away...', after: 'I caught a Swamplash here once. True story.' }),
    T({ id: 'r3_ivo', cls: 'SCHOLAR', name: 'IVO', look: 'scholar', money: 32, team: [[SP.PSYQUILL, 15]],
      intro: 'Have you studied type matchups? Let me quiz you!', lose: 'You pass! With honors!', after: 'MIND types fear SHADE moves completely.' }),
    // ---- brindle gym ----
    T({ id: 'g1_lin', cls: 'GARDENER', name: 'LIN', look: 'gardener', money: 22, team: [[SP.SPOREKIN, 9], [SP.THORNET, 9]],
      intro: 'You must get past the garden first!', lose: 'You trampled my flower bed!', after: 'FLAME moves scorch LEAF types. Just saying.' }),
    T({ id: 'g1_ash', cls: 'GARDENER', name: 'HOLLY', look: 'lass', money: 22, team: [[SP.THORNET, 10]],
      intro: 'MOSSA taught me everything. En garde!', lose: 'Wilted...', after: 'The leader is just ahead.' }),
    T({ id: 'g1_mossa', cls: 'LEADER', name: 'MOSSA', look: 'mossa', money: 100, smart: true,
      team: [[SP.THORNET, 11], [SP.SPOREKIN, 11], [SP.BRAMBLEBUN, 13]],
      intro: "Welcome to BRINDLE GYM. I'm MOSSA. Roots run deep here, and so does our resolve. Show me your growth!",
      lose: 'Splendid! You have grown strong roots. Take the SPROUT BADGE.', after: '', music: 'boss' }),
    // ---- cindermoor gym ----
    T({ id: 'g2_kai', cls: 'FIREEATER', name: 'KAI', look: 'firebreather', money: 30, team: [[SP.CINDRIP, 18], [SP.CINDRIP, 18]],
      intro: 'Feel the heat!', lose: "I'm burnt out.", after: 'TIDE moves douse flames fast.' }),
    T({ id: 'g2_dov', cls: 'HIKER', name: 'DOV', look: 'hiker', money: 30, team: [[SP.PEBBIT, 18], [SP.MAGMOLE, 19]],
      intro: 'VULK forged me in these halls!', lose: 'Crumbled!', after: 'VULK uses STONE moves too. Careful.' }),
    T({ id: 'g2_vulk', cls: 'LEADER', name: 'VULK', look: 'vulk', money: 120, smart: true,
      team: [[SP.CINDRIP, 20], [SP.MAGMOLE, 21], [SP.BLAZELYNX, 23]],
      intro: "HA! A challenger! I'm VULK, and my fire never goes out! Let's see if yours burns as bright!",
      lose: 'What a blaze! You earned this. The CINDER BADGE is yours!', after: '', music: 'boss' }),
    // ---- route 4 ----
    T({ id: 'r4_bo', cls: 'HIKER', name: 'BO', look: 'hiker', money: 32, team: [[SP.PEBBIT, 19], [SP.BOULDRAKE, 21]],
      intro: 'Mountain paths make tough Wildkin!', lose: 'Avalanche of defeat!', after: 'The SPIRE up there gives me the creeps.' }),
    T({ id: 'r4_ana', cls: 'ACE', name: 'ANA', look: 'ace', money: 40, smart: true, team: [[SP.ZAPLING, 20], [SP.SKYROOST, 21]],
      intro: "I'm on my way to SUMMIT HALL. You're a warm-up!", lose: "Okay, you're not a warm-up.", after: 'You need three badges for VICTORY PATH.' }),
    T({ id: 'r4_ty', cls: 'BIRDKEEPER', name: 'TY', look: 'birdkeeper', money: 28, team: [[SP.FLUFFIN, 19], [SP.FLUFFIN, 20], [SP.SKYROOST, 21]],
      intro: 'My birds will ruffle your feathers!', lose: 'Grounded...', after: 'Birds avoid the SPIRE. Smart birds.' }),
    T({ id: 'r4_grunt', cls: 'HOLLOW', name: 'GRUNT', look: 'grunt', money: 30, team: [[SP.DUSKFANG, 21]],
      intro: 'The SPIRE is off-limits! The ritual is starting!', lose: 'The boss will handle you...', after: 'NYX will wake the phoenix. Nothing can stop it.' }),
    // ---- hollow spire ----
    T({ id: 'sp_grunt1', cls: 'HOLLOW', name: 'GRUNT', look: 'grunt', money: 32, team: [[SP.WISPET, 22], [SP.FUNGRAVE, 23]],
      intro: 'Intruder! Intruder!', lose: 'Somebody stop this kid!', after: 'Go back down while you can.' }),
    T({ id: 'sp_grunt2', cls: 'HOLLOW', name: 'GRUNT', look: 'grunt', money: 32, team: [[SP.DUSKFANG, 23], [SP.SPOREKIN, 22]],
      intro: 'The Ember Core belongs to the ORDER!', lose: 'Our plans...', after: 'NYX is upstairs. You\'ll regret it.' }),
    T({ id: 'sp_sable', cls: 'ADMIN', name: 'SABLE', look: 'sable', money: 55, smart: true,
      team: [[SP.PHANTAIL, 24], [SP.FUNGRAVE, 24], [SP.SWAMPLASH, 25]],
      intro: 'You again. You have no idea what you are meddling in. The dawn must be ours!',
      lose: 'Impossible... Go, then. NYX will finish this.', after: '', music: 'boss' }),
    T({ id: 'sp_nyx', cls: 'LEADER', name: 'NYX', look: 'nyx', money: 80, smart: true,
      team: [[SP.PHANTAIL, 27], [SP.FUNGRAVE, 27], [SP.DUSKFANG, 28], [SP.SWAMPLASH, 29]],
      intro: 'With the Ember Core, the first dawn answers only to the HOLLOW ORDER. A world in our shadow! You will not stand in the way.',
      lose: 'The core... it rejects me? Then let the dawn choose its own keeper. We are finished here.', after: '', music: 'boss' }),
    // ---- galewick gym ----
    T({ id: 'g3_bea', cls: 'SKIER', name: 'BEA', look: 'skier', money: 34, team: [[SP.FROSTLING, 27], [SP.FROSTLING, 28]],
      intro: 'Slippery slope ahead!', lose: 'Wiped out!', after: 'FLAME and STONE melt FROST.' }),
    T({ id: 'g3_tor', cls: 'BIRDKEEPER', name: 'TOR', look: 'birdkeeper', money: 34, team: [[SP.SKYROOST, 28], [SP.SKYROOST, 28]],
      intro: 'ISOLDE\'s winds lift us all!', lose: 'Clipped wings!', after: 'VOLT moves zap GALE types.' }),
    T({ id: 'g3_isolde', cls: 'LEADER', name: 'ISOLDE', look: 'isolde', money: 140, smart: true,
      team: [[SP.SKYROOST, 30], [SP.FROSTLING, 31], [SP.GALECREST, 32], [SP.GLACIARCH, 33]],
      intro: 'The wind told me you were coming. I am ISOLDE. Let us see if you can stand in a storm.',
      lose: 'The storm has passed, and you still stand. The GALE BADGE is yours.', after: '', music: 'boss' }),
    // ---- route 5 ----
    T({ id: 'r5_vera', cls: 'ACE', name: 'VERA', look: 'ace', money: 45, smart: true, team: [[SP.STORMANE, 30], [SP.LUNAMOTH, 31]],
      intro: 'Only the best walk VICTORY PATH!', lose: 'You are the best, then.', after: 'The champion uses MIND and SHADE types.' }),
    T({ id: 'r5_otto', cls: 'ACE', name: 'OTTO', look: 'ace', money: 45, smart: true, team: [[SP.BOULDRAKE, 31], [SP.MAGMOLE, 31], [SP.IRONOX, 32]],
      intro: 'My team is solid as granite!', lose: 'Cracked!', after: 'Keep your HP topped up.' }),
    T({ id: 'r5_luz', cls: 'SCHOLAR', name: 'LUZ', look: 'scholar', money: 40, smart: true, team: [[SP.ORACLEON, 32], [SP.PHANTAIL, 32]],
      intro: 'I foresaw this battle. And my victory!', lose: 'My foresight was... cloudy.', after: 'SPIRIT beats SHADE. Remember it.' }),
    // ---- champion ----
    T({ id: 'champ', cls: 'CHAMPION', name: 'ELOWEN', look: 'elowen', money: 200, smart: true,
      team: [[SP.PHANTAIL, 37], [SP.LUNAMOTH, 37], [SP.SWAMPLASH, 38], [SP.STORMANE, 38], [SP.GLACIARCH, 39], [SP.ORACLEON, 40]],
      intro: 'So you are the one who calmed the dawn phoenix. I am ELOWEN, CHAMPION of VARROW. Give me everything you have.',
      lose: 'Magnificent. The title of CHAMPION is yours. VARROW has a new legend.', after: '', music: 'boss' }),
  ].map((t) => [t.id, t]),
);

export function trainerTeam(t: TrainerDef, s: GameState): [number, number][] {
  return typeof t.team === 'function' ? t.team(s) : t.team;
}
