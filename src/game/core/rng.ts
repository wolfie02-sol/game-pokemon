/** Small deterministic PRNG (mulberry32). The seed is part of the save file. */
export class Rng {
  constructor(public seed: number) {}

  next(): number {
    let t = (this.seed = (this.seed + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [0, n). */
  int(n: number): number {
    return Math.floor(this.next() * n);
  }

  /** Integer in [a, b] inclusive. */
  range(a: number, b: number): number {
    return a + this.int(b - a + 1);
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[this.int(arr.length)];
  }

  weighted<T extends { w: number }>(arr: readonly T[]): T {
    const total = arr.reduce((s, e) => s + e.w, 0);
    let r = this.next() * total;
    for (const e of arr) {
      r -= e.w;
      if (r < 0) return e;
    }
    return arr[arr.length - 1];
  }
}
