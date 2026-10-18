/**
 * Sentence-aware dialogue pagination shared by every text box in the game.
 *
 * Rules:
 *  - A page holds whole sentences only; a sentence is never split across pages.
 *  - Consecutive sentences share a page while they fit in the normal box height.
 *  - A sentence too long for the normal box gets a taller box (more lines) on its
 *    own page instead of being split.
 *  - "\n\n" forces a page break (used between different speakers).
 *  - Lines wrap at word boundaries; a word longer than a line is hyphen-free hard-broken.
 */

/** Characters per line inside the dialogue box (box is 160px, glyph advance 6px). */
export const LINE_CHARS = 24;
/** Lines that fit in the standard 48px box. */
export const BASE_LINES = 3;
/** Tallest box allowed (still leaves the top of the screen visible). */
export const MAX_LINES = 9;

const ABBREV = new Set(['PROF.', 'DR.', 'MR.', 'MRS.', 'MS.', 'LV.', 'NO.', 'VS.', 'ST.', 'MT.', 'E.G.', 'I.E.']);

/** Split text into sentences, keeping punctuation and closing quotes attached. */
export function sentences(text: string): string[] {
  const out: string[] = [];
  const words = text.split(/\s+/).filter(Boolean);
  let cur: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    cur.push(w);
    const next = words[i + 1];
    const core = w.replace(/["')\]]+$/, '');
    const endsSentence = /[.!?…]$/.test(core);
    if (!endsSentence || !next) continue;
    if (ABBREV.has(core.toUpperCase())) continue;
    // a trailing "..." only ends the sentence when the next word starts a new one
    if (/\.\.\.$|…$/.test(core) && !/^["'(]?[A-Z0-9{]/.test(next)) continue;
    out.push(cur.join(' '));
    cur = [];
  }
  if (cur.length) out.push(cur.join(' '));
  return out;
}

/** Word-wrap one string into lines of at most `width` characters. */
export function wrapWords(text: string, width = LINE_CHARS): string[] {
  const lines: string[] = [];
  let line = '';
  for (let word of text.split(/\s+/).filter(Boolean)) {
    while (word.length > width) {
      if (line) {
        lines.push(line);
        line = '';
      }
      lines.push(word.slice(0, width));
      word = word.slice(width);
    }
    if (!line) line = word;
    else if (line.length + 1 + word.length <= width) line += ' ' + word;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

/**
 * Break a sentence that cannot fit even the tallest box into chunks at clause
 * boundaries (commas, semicolons, dashes, colons), falling back to words.
 * Only used for extreme lengths; normal dialogue never reaches this.
 */
function splitOversized(sentence: string, width: number, maxLines: number): string[] {
  const parts = sentence.split(/(?<=[,;:])\s+/);
  const chunks: string[] = [];
  let cur = '';
  for (const p of parts) {
    const cand = cur ? cur + ' ' + p : p;
    if (wrapWords(cand, width).length <= maxLines) cur = cand;
    else {
      if (cur) chunks.push(cur);
      cur = p;
    }
  }
  if (cur) chunks.push(cur);
  // any piece still too long: split by words
  return chunks.flatMap((ch) => {
    const lines = wrapWords(ch, width);
    if (lines.length <= maxLines) return [ch];
    const res: string[] = [];
    for (let i = 0; i < lines.length; i += maxLines) res.push(lines.slice(i, i + maxLines).join(' '));
    return res;
  });
}

export interface PaginateOpts {
  width?: number;
  baseLines?: number;
  maxLines?: number;
}

/** Returns pages, each an array of wrapped lines. */
export function paginate(text: string, opts: PaginateOpts = {}): string[][] {
  const width = opts.width ?? LINE_CHARS;
  const base = opts.baseLines ?? BASE_LINES;
  const max = opts.maxLines ?? MAX_LINES;
  const pages: string[][] = [];
  for (const para of text.split(/\n\s*\n/)) {
    const sents = sentences(para.replace(/\n/g, ' ')).flatMap((s) =>
      wrapWords(s, width).length > max ? splitOversized(s, width, max) : [s],
    );
    let cur = '';
    for (const s of sents) {
      const cand = cur ? cur + ' ' + s : s;
      if (!cur || wrapWords(cand, width).length <= base) {
        // the first sentence of a page always goes in, growing the box if needed
        cur = cand;
        if (wrapWords(cur, width).length > base) {
          pages.push(wrapWords(cur, width));
          cur = '';
        }
      } else {
        pages.push(wrapWords(cur, width));
        cur = s;
        if (wrapWords(cur, width).length > base) {
          pages.push(wrapWords(cur, width));
          cur = '';
        }
      }
    }
    if (cur) pages.push(wrapWords(cur, width));
  }
  return pages.length ? pages : [['']];
}
