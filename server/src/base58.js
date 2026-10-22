// Base58 (Bitcoin alphabet), used for Solana addresses and signatures.
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const MAP = new Map([...ALPHABET].map((c, i) => [c, i]));

export function decode(str) {
  if (typeof str !== 'string' || !str.length) throw new Error('empty base58');
  const bytes = [];
  for (const ch of str) {
    const v = MAP.get(ch);
    if (v === undefined) throw new Error('invalid base58 character');
    let carry = v;
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const ch of str) {
    if (ch !== '1') break;
    bytes.push(0);
  }
  return Uint8Array.from(bytes.reverse());
}

export function encode(buf) {
  const bytes = Uint8Array.from(buf);
  const digits = [];
  for (const b of bytes) {
    let carry = b;
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] << 8;
      digits[i] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let out = '';
  for (const b of bytes) {
    if (b !== 0) break;
    out += '1';
  }
  for (let i = digits.length - 1; i >= 0; i--) out += ALPHABET[digits[i]];
  return out;
}

/** True if the string decodes to a 32-byte public key. */
export function isAddress(str) {
  try {
    return decode(str).length === 32;
  } catch {
    return false;
  }
}
