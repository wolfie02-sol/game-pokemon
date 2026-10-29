/** Outline colour the character painter reads off G.PAL. The full terrain palette is not needed. */
const G = (globalThis as unknown as { G: { gfx: { hex: (s: string) => number }; PAL?: { outline: number } } }).G;
G.PAL = { outline: G.gfx.hex('#1b1a2e') };
