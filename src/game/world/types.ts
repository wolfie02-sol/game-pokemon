import type { Dir } from '../core/input';
import type { Game } from '../core/game';
import type { GameState } from '../systems/state';

export interface Warp {
  x: number;
  y: number;
  to: string;
  tx: number;
  ty: number;
  /** facing on arrival */
  dir?: Dir;
  /** if set, the warp fires when pushing this direction while standing on it */
  edge?: Dir;
  /** locked doors: the warp only works while cond holds */
  cond?: (s: GameState) => boolean;
  locked?: string;
}

export interface NpcDef {
  id: string;
  x: number;
  y: number;
  dir: Dir;
  look: string;
  move?: 'still' | 'wander' | 'look';
  /** wander radius */
  radius?: number;
  talk?: Script | string | string[];
  trainer?: string;
  /** runs after the player beats this NPC's trainer battle */
  afterWin?: Script;
  /** sight range for trainers (default 4) */
  sight?: number;
  cond?: (s: GameState) => boolean;
}

export interface SignDef {
  x: number;
  y: number;
  text: string | string[] | Script;
}

export interface GroundItem {
  id: string;
  x: number;
  y: number;
  item: string;
  n?: number;
  /** hidden items sparkle only when you face them; fossils etc. run a script */
  script?: Script;
  cond?: (s: GameState) => boolean;
}

export interface Trigger {
  x: number;
  y: number;
  w?: number;
  h?: number;
  cond?: (s: GameState) => boolean;
  run: Script;
}

export interface EncounterTable {
  rate: number;
  table: { sp: number; min: number; max: number; w: number }[];
}

export interface Connection {
  map: string;
  /** added to the coordinate along the shared edge */
  offset: number;
}

export interface MapDef {
  id: string;
  name: string;
  w: number;
  h: number;
  tiles: number[];
  border: number;
  music: string;
  outdoor: boolean;
  warps: Warp[];
  npcs: NpcDef[];
  signs: SignDef[];
  items: GroundItem[];
  triggers: Trigger[];
  encounters?: EncounterTable;
  connections?: Partial<Record<Dir, Connection>>;
  onEnter?: Script;
  /** marks a HAVEN interior: whiting out returns here */
  havenSpot?: { x: number; y: number };
  /** encounters while riding the driftboard */
  surf?: EncounterTable;
  /** encounters with the fishing rod */
  fish?: EncounterTable;
  /** towns can be flown to; this is where the player lands */
  fly?: { x: number; y: number };
  /** caves and buildings the escape rope works in */
  escape?: boolean;
  /** base ground used to tint terrain edges */
  ground?: 'grass' | 'snow' | 'ash';
}

export interface NpcRuntime {
  def: NpcDef;
  x: number;
  y: number;
  dir: Dir;
  /** pixel offset while moving */
  ox: number;
  oy: number;
  moving: Dir | null;
  timer: number;
  hidden: boolean;
  homeX: number;
  homeY: number;
  emote: number;
}

export interface ScriptCtx {
  g: Game;
  s: GameState;
  /** the NPC that started this script, if any */
  self: NpcRuntime | null;
  say(t: string | string[]): Promise<void>;
  ask(t: string, opts: string[], cancel?: number | null): Promise<number>;
  yesNo(t: string): Promise<boolean>;
  flag(k: string): boolean;
  set(k: string, v?: boolean): void;
  give(item: string, n?: number): Promise<void>;
  heal(): Promise<void>;
  battle(trainerId: string): Promise<boolean>;
  wild(sp: number, lvl: number, opts?: { noRun?: boolean; music?: string }): Promise<'win' | 'lose' | 'run' | 'caught'>;
  npc(id: string): NpcRuntime | undefined;
  walkNpc(id: string, path: Dir[], speed?: number): Promise<void>;
  walkPlayer(path: Dir[]): Promise<void>;
  face(id: string, dir: Dir): void;
  facePlayer(dir: Dir): void;
  faceToward(id: string): void;
  show(id: string, x?: number, y?: number, dir?: Dir): void;
  hide(id: string): void;
  emote(id: string | 'player'): Promise<void>;
  warp(map: string, x: number, y: number, dir?: Dir): Promise<void>;
  wait(frames: number): Promise<void>;
  music(name: string | null): void;
  shop(stock: string[]): Promise<void>;
  storage(): Promise<void>;
  receiveMon(sp: number, lvl: number, nick?: boolean): Promise<void>;
  /** hide an NPC and remember it stays gone (e.g. a defeated blocker) */
  gone(id: string): void;
  money(n: number): void;
  badge(name: string): Promise<void>;
  flash(): Promise<void>;
}

export type Script = (c: ScriptCtx) => Promise<void>;
