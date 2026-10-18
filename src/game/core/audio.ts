/**
 * WebAudio chiptune synth: square-wave lead, triangle bass and a noise
 * drum channel, plus synthesized sound effects. All music is original.
 */

type Chan = 'lead' | 'bass' | 'drum';
interface Track {
  bpm: number;
  loop: Partial<Record<Chan, string>>;
  intro?: Partial<Record<Chan, string>>;
  /** If true the track plays once and stops. */
  once?: boolean;
}

const TRACKS: Record<string, Track> = {
  title: {
    bpm: 132,
    loop: {
      lead: 'G4:2 C5:2 E5:2 G5:2 A5:4 G5:2 E5:2 F5:2 A5:2 C6:2 A5:2 G5:6 -:2 E5:2 G5:2 C6:2 E6:2 D6:4 C6:2 A5:2 B5:2 G5:2 A5:2 B5:2 C6:6 -:2',
      bass: 'C3:4 G3:4 F3:4 C3:4 F3:4 A3:4 G3:4 D3:4 C3:4 E3:4 F3:4 D3:4 G3:4 B2:4 C3:6 -:2',
      drum: 'k:4 s:4 k:4 s:4 k:4 s:4 k:2 k:2 s:4 k:4 s:4 k:4 s:4 k:4 s:4 k:2 k:2 s:2 s:2',
    },
  },
  town: {
    bpm: 112,
    loop: {
      lead: 'B4:2 D5:2 G5:2 D5:2 E5:3 D5:1 B4:4 C5:2 E5:2 A5:2 G5:2 F#5:6 -:2 B4:2 D5:2 G5:2 B5:2 A5:3 G5:1 E5:4 C5:2 D5:2 F#5:2 A5:2 G5:6 -:2',
      bass: 'G2:2 D3:2 G3:2 D3:2 C3:2 G3:2 C3:2 G3:2 A2:2 E3:2 A2:2 E3:2 D3:2 A3:2 D3:2 F#3:2 G2:2 D3:2 G3:2 D3:2 E3:2 B3:2 E3:2 B3:2 C3:2 G3:2 D3:2 A3:2 G2:4 D3:4',
    },
  },
  route: {
    bpm: 140,
    loop: {
      lead: 'D5:2 F#5:1 A5:1 D6:2 A5:2 B5:2 A5:2 F#5:2 E5:2 G5:2 B5:1 G5:1 E5:2 G5:2 A5:4 -:2 A4:2 D5:2 E5:2 F#5:2 A5:2 B5:3 C#6:1 D6:2 B5:2 A5:2 F#5:2 G5:2 E5:2 D5:6 -:2',
      bass: 'D3:2 A3:2 D3:2 A3:2 G2:2 D3:2 G2:2 D3:2 E3:2 B3:2 E3:2 B3:2 A2:2 E3:2 A2:2 C#3:2 D3:2 A3:2 D3:2 A3:2 G2:2 D3:2 G2:2 B2:2 A2:2 E3:2 A2:2 E3:2 D3:4 A2:4',
      drum: 'k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2',
    },
  },
  haven: {
    bpm: 100,
    loop: {
      lead: 'C5:2 E5:2 G5:2 E5:2 F5:2 A5:2 C6:4 B4:2 D5:2 G5:2 D5:2 C5:6 -:2',
      bass: 'C3:4 G2:4 F2:4 A2:4 G2:4 B2:4 C3:4 G2:4',
    },
  },
  cave: {
    bpm: 92,
    loop: {
      lead: 'E5:4 G5:4 F#5:6 -:2 D5:4 E5:4 B4:8 E5:4 G5:4 A5:6 -:2 B5:4 G5:2 F#5:2 E5:8',
      bass: 'E2:2 B2:2 E3:2 B2:2 D2:2 A2:2 D3:2 A2:2 C2:2 G2:2 C3:2 G2:2 B1:2 F#2:2 B2:2 F#2:2 E2:2 B2:2 E3:2 B2:2 F2:2 C3:2 F3:2 C3:2 G2:2 D3:2 B1:2 F#2:2 E2:4 B1:4',
    },
  },
  battle: {
    bpm: 168,
    loop: {
      lead: 'A5:1 E5:1 A5:1 C6:1 B5:2 A5:2 G5:1 E5:1 G5:1 B5:1 A5:2 G5:2 F5:2 A5:2 C6:2 E6:2 D6:4 E6:4 A5:1 E5:1 A5:1 C6:1 B5:2 A5:2 G5:1 D5:1 G5:1 B5:1 C6:2 D6:2 E6:2 D6:2 C6:2 B5:2 A5:6 G#5:2',
      bass: 'A2:1 A3:1 A2:1 A3:1 A2:1 A3:1 A2:1 A3:1 G2:1 G3:1 G2:1 G3:1 G2:1 G3:1 G2:1 G3:1 F2:1 F3:1 F2:1 F3:1 F2:1 F3:1 F2:1 F3:1 E2:1 E3:1 E2:1 E3:1 E2:1 E3:1 E2:1 E3:1 A2:1 A3:1 A2:1 A3:1 A2:1 A3:1 A2:1 A3:1 G2:1 G3:1 G2:1 G3:1 G2:1 G3:1 G2:1 G3:1 F2:1 F3:1 F2:1 F3:1 G2:1 G3:1 G2:1 G3:1 E2:1 E3:1 E2:1 E3:1 E2:1 E3:1 E2:1 E3:1',
      drum: 'k:1 h:1 s:1 h:1 k:1 h:1 s:1 h:1 k:1 h:1 s:1 h:1 k:1 h:1 s:1 h:1 k:1 h:1 s:1 h:1 k:1 h:1 s:1 h:1 k:1 h:1 s:1 h:1 k:1 k:1 s:1 s:1 k:1 h:1 s:1 h:1 k:1 h:1 s:1 h:1 k:1 h:1 s:1 h:1 k:1 h:1 s:1 h:1 k:1 h:1 s:1 h:1 k:1 h:1 s:1 h:1 k:1 h:1 s:1 h:1 s:1 s:1 s:1 s:1',
    },
  },
  boss: {
    bpm: 176,
    loop: {
      lead: 'D5:1 F5:1 A5:1 D6:1 C6:2 A5:2 A#5:2 A5:2 G5:2 F5:2 E5:1 G5:1 A#5:1 E6:1 D6:2 A#5:2 A5:6 C#6:2 D6:2 A5:2 F5:2 D5:2 A#5:2 G5:2 E5:2 C#5:2 D5:1 E5:1 F5:1 G5:1 A5:2 A#5:2 A5:4 C#6:4',
      bass: 'D2:1 D3:1 D2:1 D3:1 D2:1 D3:1 D2:1 D3:1 A#1:1 A#2:1 A#1:1 A#2:1 A#1:1 A#2:1 A#1:1 A#2:1 C2:1 C3:1 C2:1 C3:1 C2:1 C3:1 C2:1 C3:1 A1:1 A2:1 A1:1 A2:1 A1:1 A2:1 A1:1 A2:1 D2:1 D3:1 D2:1 D3:1 D2:1 D3:1 D2:1 D3:1 A#1:1 A#2:1 A#1:1 A#2:1 A#1:1 A#2:1 A#1:1 A#2:1 C2:1 C3:1 C2:1 C3:1 C2:1 C3:1 C2:1 C3:1 A1:1 A2:1 A1:1 A2:1 A1:1 A2:1 A1:1 A2:1',
      drum: 'k:1 h:1 s:1 k:1 k:1 h:1 s:1 h:1 k:1 h:1 s:1 k:1 k:1 h:1 s:1 h:1 k:1 h:1 s:1 k:1 k:1 h:1 s:1 h:1 k:1 h:1 s:1 k:1 s:1 s:1 s:1 s:1 k:1 h:1 s:1 k:1 k:1 h:1 s:1 h:1 k:1 h:1 s:1 k:1 k:1 h:1 s:1 h:1 k:1 h:1 s:1 k:1 k:1 h:1 s:1 h:1 k:1 k:1 s:1 k:1 s:1 s:1 s:1 s:1',
    },
  },
  gym: {
    bpm: 128,
    loop: {
      lead: 'C5:2 D#5:2 G5:2 C6:2 A#5:3 G#5:1 G5:4 G#5:2 G5:2 F5:2 D#5:2 D5:6 -:2 C5:2 D#5:2 G5:2 C6:2 D6:3 D#6:1 D6:2 C6:2 A#5:2 G#5:2 G5:2 F5:2 G5:6 -:2',
      bass: 'C3:2 G3:2 C3:2 G3:2 G#2:2 D#3:2 G#2:2 D#3:2 F2:2 C3:2 F2:2 C3:2 G2:2 D3:2 G2:2 D3:2 C3:2 G3:2 C3:2 G3:2 A#2:2 F3:2 A#2:2 F3:2 G#2:2 D#3:2 G#2:2 D#3:2 G2:2 D3:2 G2:2 B2:2',
      drum: 'k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2 k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 k:2 s:2 s:2 s:2',
    },
  },
  hideout: {
    bpm: 120,
    loop: {
      lead: 'E5:2 F5:2 E5:2 B4:2 D#5:2 E5:2 D#5:2 A4:2 C5:2 D#5:2 F#5:2 A5:2 G5:4 F#5:4 E5:2 F5:2 E5:2 B4:2 D#5:2 E5:2 G5:2 B5:2 A#5:2 A5:2 G5:2 F#5:2 E5:8',
      bass: 'E2:1 E2:1 -:2 E2:1 E2:1 -:2 D#2:1 D#2:1 -:2 D#2:1 D#2:1 -:2 C2:1 C2:1 -:2 C2:1 C2:1 -:2 B1:1 B1:1 -:2 B1:1 B1:1 -:2 E2:1 E2:1 -:2 E2:1 E2:1 -:2 D#2:1 D#2:1 -:2 D#2:1 D#2:1 -:2 C2:1 C2:1 -:2 B1:1 B1:1 -:2 E2:4 B1:4',
      drum: 'k:2 h:2 k:2 h:2 k:2 h:2 k:2 h:2 k:2 h:2 k:2 h:2 k:2 h:2 s:2 s:2 k:2 h:2 k:2 h:2 k:2 h:2 k:2 h:2 k:2 h:2 k:2 h:2 k:2 h:2 s:2 s:2',
    },
  },
  victory: {
    bpm: 150,
    intro: {
      lead: 'C5:1 E5:1 G5:1 C6:3 B5:1 C6:1 D6:2 E6:6',
      bass: 'C3:2 G3:2 C3:2 E3:2 G3:2 C4:6',
    },
    loop: {
      lead: 'E5:2 G5:2 C6:2 G5:2 F5:2 A5:2 D6:2 A5:2 E5:2 G5:2 C6:2 E6:2 D6:4 G5:4',
      bass: 'C3:4 G3:4 F3:4 D3:4 C3:4 E3:4 G3:4 G2:4',
    },
  },
  ending: {
    bpm: 96,
    loop: {
      lead: 'E5:4 D5:2 C5:2 D5:4 G4:4 C5:4 B4:2 A4:2 B4:8 C5:4 E5:2 G5:2 A5:4 G5:4 F5:2 E5:2 D5:2 B4:2 C5:8',
      bass: 'C3:8 G2:8 A2:8 E2:8 F2:8 C3:8 G2:8 C3:8',
    },
  },
};

interface Note {
  f: number | null;
  d: number;
  drum?: string;
}

const SEMI: Record<string, number> = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };

function freq(name: string): number {
  const m = /^([A-G])(#?)(\d)$/.exec(name);
  if (!m) return 440;
  const n = SEMI[m[1]] + (m[2] ? 1 : 0) + (parseInt(m[3]) - 4) * 12;
  return 440 * Math.pow(2, n / 12);
}

function parse(str: string | undefined, drum = false): Note[] {
  if (!str) return [];
  return str
    .trim()
    .split(/\s+/)
    .map((tok) => {
      const [n, d] = tok.split(':');
      const dur = parseFloat(d ?? '1');
      if (n === '-') return { f: null, d: dur };
      if (drum) return { f: null, d: dur, drum: n };
      return { f: freq(n), d: dur };
    });
}

interface ParsedTrack {
  bpm: number;
  once: boolean;
  intro: Record<Chan, Note[]> | null;
  loop: Record<Chan, Note[]>;
}

function pad(chs: Record<Chan, Note[]>) {
  const len = (a: Note[]) => a.reduce((s, n) => s + n.d, 0);
  const max = Math.max(...(Object.values(chs) as Note[][]).map(len));
  for (const k of Object.keys(chs) as Chan[]) {
    const l = len(chs[k]);
    if (l > 0 && l < max) chs[k].push({ f: null, d: max - l });
  }
  return chs;
}

const parsed: Record<string, ParsedTrack> = {};
function getTrack(name: string): ParsedTrack | null {
  if (parsed[name]) return parsed[name];
  const t = TRACKS[name];
  if (!t) return null;
  const mk = (c: Partial<Record<Chan, string>>) =>
    pad({ lead: parse(c.lead), bass: parse(c.bass), drum: parse(c.drum, true) });
  parsed[name] = { bpm: t.bpm, once: !!t.once, intro: t.intro ? mk(t.intro) : null, loop: mk(t.loop) };
  return parsed[name];
}

type SfxStep = [type: OscillatorType | 'noise', f0: number, f1: number, dur: number, vol: number];
const SFX: Record<string, SfxStep[]> = {
  select: [['square', 1200, 1200, 0.03, 0.18]],
  confirm: [
    ['square', 880, 880, 0.04, 0.2],
    ['square', 1320, 1320, 0.06, 0.2],
  ],
  cancel: [['square', 660, 440, 0.07, 0.18]],
  bump: [['square', 90, 70, 0.08, 0.3]],
  door: [
    ['noise', 0, 0, 0.05, 0.25],
    ['square', 220, 110, 0.1, 0.15],
  ],
  ledge: [['square', 300, 700, 0.12, 0.18]],
  hit: [
    ['noise', 0, 0, 0.08, 0.45],
    ['square', 200, 80, 0.08, 0.25],
  ],
  super: [
    ['noise', 0, 0, 0.06, 0.5],
    ['square', 300, 60, 0.15, 0.3],
    ['noise', 0, 0, 0.06, 0.4],
  ],
  weak: [['noise', 0, 0, 0.05, 0.25]],
  faint: [['square', 700, 90, 0.5, 0.25]],
  throw: [['triangle', 300, 900, 0.2, 0.3]],
  shake: [
    ['square', 400, 300, 0.05, 0.2],
    ['noise', 0, 0, 0.03, 0.2],
  ],
  catch: [
    ['square', 523, 523, 0.08, 0.2],
    ['square', 659, 659, 0.08, 0.2],
    ['square', 784, 784, 0.08, 0.2],
    ['square', 1047, 1047, 0.25, 0.2],
  ],
  heal: [
    ['square', 784, 784, 0.12, 0.18],
    ['square', 659, 659, 0.12, 0.18],
    ['square', 784, 784, 0.12, 0.18],
    ['square', 1047, 1047, 0.3, 0.18],
  ],
  levelup: [
    ['square', 523, 523, 0.07, 0.2],
    ['square', 659, 659, 0.07, 0.2],
    ['square', 784, 784, 0.07, 0.2],
    ['square', 1047, 1047, 0.07, 0.2],
    ['square', 1319, 1319, 0.2, 0.2],
  ],
  item: [
    ['square', 659, 659, 0.1, 0.2],
    ['square', 880, 880, 0.1, 0.2],
    ['square', 1175, 1175, 0.3, 0.2],
  ],
  encounter: [['square', 200, 1600, 0.35, 0.18]],
  exclaim: [
    ['square', 1400, 1400, 0.05, 0.2],
    ['square', 1800, 1800, 0.08, 0.2],
  ],
  save: [
    ['square', 880, 880, 0.08, 0.18],
    ['square', 1175, 1175, 0.15, 0.18],
  ],
  buy: [
    ['square', 1320, 1320, 0.05, 0.2],
    ['square', 1760, 1760, 0.1, 0.2],
  ],
  run: [['square', 400, 1200, 0.25, 0.15]],
  statup: [['square', 400, 1600, 0.3, 0.15]],
  statdown: [['square', 1600, 300, 0.3, 0.15]],
  evolve: [['triangle', 200, 1800, 1.2, 0.3]],
  error: [
    ['square', 200, 200, 0.08, 0.2],
    ['square', 150, 150, 0.12, 0.2],
  ],
  menu: [['square', 1000, 1400, 0.05, 0.16]],
};

export class Audio {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicGain!: GainNode;
  private sfxGain!: GainNode;
  private noise!: AudioBuffer;
  private timer: number | null = null;
  private trackName: string | null = null;
  private track: ParsedTrack | null = null;
  private section: 'intro' | 'loop' = 'loop';
  private pos: Record<Chan, { i: number; t: number }> = {
    lead: { i: 0, t: 0 },
    bass: { i: 0, t: 0 },
    drum: { i: 0, t: 0 },
  };
  private sectionStart = 0;
  private sectionLen = 0;
  muted = false;
  musicOn = true;
  sfxOn = true;
  onChange: (() => void) | null = null;

  /** Must be called from a user gesture. */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicOn ? 0.32 : 0;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxOn ? 0.7 : 0;
      this.sfxGain.connect(this.master);
      const len = this.ctx.sampleRate * 0.5;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      if (this.trackName) {
        const n = this.trackName;
        this.trackName = null;
        this.play(n);
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx) this.master.gain.value = m ? 0 : 0.5;
    this.onChange?.();
  }

  setMusic(on: boolean) {
    this.musicOn = on;
    if (this.ctx) this.musicGain.gain.value = on ? 0.32 : 0;
    this.onChange?.();
  }

  setSfx(on: boolean) {
    this.sfxOn = on;
    if (this.ctx) this.sfxGain.gain.value = on ? 0.7 : 0;
    this.onChange?.();
  }

  get current() {
    return this.trackName;
  }

  play(name: string) {
    if (this.trackName === name) return;
    this.stop();
    this.trackName = name;
    this.track = getTrack(name);
    if (!this.ctx || !this.track) return;
    this.startSection(this.track.intro ? 'intro' : 'loop', this.ctx.currentTime + 0.05);
    this.timer = window.setInterval(() => this.schedule(), 25);
    this.schedule();
  }

  stop() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.trackName = null;
    this.track = null;
  }

  private startSection(s: 'intro' | 'loop', t: number) {
    this.section = s;
    this.sectionStart = t;
    const chs = s === 'intro' ? this.track!.intro! : this.track!.loop;
    const beat = 60 / this.track!.bpm / 2; // eighth note
    this.sectionLen = Math.max(...(Object.values(chs) as Note[][]).map((a) => a.reduce((x, n) => x + n.d, 0))) * beat;
    for (const c of ['lead', 'bass', 'drum'] as Chan[]) this.pos[c] = { i: 0, t };
  }

  private schedule() {
    if (!this.ctx || !this.track) return;
    const ahead = this.ctx.currentTime + 0.15;
    const beat = 60 / this.track.bpm / 2;
    const chs = this.section === 'intro' ? this.track.intro! : this.track.loop;
    for (const c of ['lead', 'bass', 'drum'] as Chan[]) {
      const notes = chs[c];
      if (!notes.length) continue;
      const p = this.pos[c];
      while (p.i < notes.length && p.t < ahead) {
        const n = notes[p.i];
        const dur = n.d * beat;
        if (n.f) this.tone(c, n.f, p.t, dur);
        else if (n.drum) this.drum(n.drum, p.t);
        p.t += dur;
        p.i++;
      }
    }
    const end = this.sectionStart + this.sectionLen;
    if (ahead >= end && (['lead', 'bass', 'drum'] as Chan[]).every((c) => this.pos[c].i >= chs[c].length)) {
      if (this.track.once) {
        this.stop();
        return;
      }
      this.startSection('loop', end);
    }
  }

  private tone(c: Chan, f: number, t: number, dur: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = c === 'lead' ? 'square' : 'triangle';
    o.frequency.value = f;
    const vol = c === 'lead' ? 0.16 : 0.42;
    const len = Math.max(0.03, dur * 0.92);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.setValueAtTime(vol * (c === 'lead' ? 0.75 : 1), t + Math.min(0.06, len * 0.5));
    g.gain.linearRampToValueAtTime(0, t + len);
    o.connect(g).connect(this.musicGain);
    o.start(t);
    o.stop(t + len + 0.02);
  }

  private drum(kind: string, t: number) {
    const ctx = this.ctx!;
    if (kind === 'k') {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      g.gain.setValueAtTime(0.6, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      o.connect(g).connect(this.musicGain);
      o.start(t);
      o.stop(t + 0.15);
      return;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = kind === 'h' ? 'highpass' : 'bandpass';
    f.frequency.value = kind === 'h' ? 7000 : 1800;
    const len = kind === 'h' ? 0.04 : 0.1;
    g.gain.setValueAtTime(kind === 'h' ? 0.12 : 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    src.connect(f).connect(g).connect(this.musicGain);
    src.start(t);
    src.stop(t + len + 0.01);
  }

  sfx(name: string) {
    const steps = SFX[name];
    if (!this.ctx || !steps || !this.sfxOn) return;
    let t = this.ctx.currentTime + 0.005;
    for (const [type, f0, f1, dur, vol] of steps) {
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.setValueAtTime(vol, t + dur * 0.7);
      g.gain.linearRampToValueAtTime(0, t + dur);
      g.connect(this.sfxGain);
      if (type === 'noise') {
        const s = this.ctx.createBufferSource();
        s.buffer = this.noise;
        s.connect(g);
        s.start(t);
        s.stop(t + dur);
      } else {
        const o = this.ctx.createOscillator();
        o.type = type;
        o.frequency.setValueAtTime(f0, t);
        if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
        o.connect(g);
        o.start(t);
        o.stop(t + dur + 0.01);
      }
      t += dur;
    }
  }
}
