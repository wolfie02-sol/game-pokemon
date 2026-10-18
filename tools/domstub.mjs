// Minimal DOM stand-ins so art/tile modules can run under node for validation.
const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ data: new Uint8ClampedArray(48 * 48 * 4) })), set: (t, k, v) => ((t[k] = v), true) });
if (typeof globalThis.document === 'undefined') {
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx, style: {} }) };
}
