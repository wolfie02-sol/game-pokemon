/** Shared sprite runtime object. Vendored scripts attach the rasterizer to it. */
const g = globalThis as typeof globalThis & { G?: Record<string, unknown> };
g.G = g.G ?? {};
