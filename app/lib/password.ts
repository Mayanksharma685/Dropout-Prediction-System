// Password hashing utilities using Web Crypto PBKDF2 (compatible with Cloudflare Workers)
// Format: pbkdf2$iterations$saltBase64$hashBase64

const ITERATIONS = 100_000
const KEYLEN = 32
const DIGEST = 'SHA-256'

function getSubtle(): SubtleCrypto {
  // In Workers/Edge runtime, crypto.subtle is available globally
  // In Node during dev, globalThis.crypto may exist via Node 19+, else throw
  const c = (globalThis as any).crypto
  if (!c || !c.subtle) {
    throw new Error('Web Crypto API not available for password hashing')
  }
  return c.subtle as SubtleCrypto
}

function getRandomBytes(length: number): Uint8Array {
  const c = (globalThis as any).crypto
  const arr = new Uint8Array(length)
  c.getRandomValues(arr)
  return arr
}

function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''
  for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i])
  return btoa(binary)
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64)
  const u8 = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) u8[i] = binary.charCodeAt(i)
  return u8
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = getRandomBytes(16)
  const subtle = getSubtle()
  const enc = new TextEncoder()
  const keyMaterial = await subtle.importKey('raw', enc.encode(plainText), 'PBKDF2', false, [
    'deriveBits',
    'deriveKey',
  ])
  const params = { name: 'PBKDF2', hash: DIGEST, salt, iterations: ITERATIONS }
  const derived = await subtle.deriveBits(params as any, keyMaterial, KEYLEN * 8)
  const out = toBase64(derived)
  const saltB64 = toBase64(salt)
  return `pbkdf2$${ITERATIONS}$${saltB64}$${out}`
}

export async function verifyPassword(plainText: string, stored: string): Promise<boolean> {
  try {
    const [scheme, iterStr, saltB64, hashB64] = stored.split('$')
    if (scheme !== 'pbkdf2') return false
    const iterations = parseInt(iterStr, 10)
    if (!iterations || !saltB64 || !hashB64) return false
    const salt = fromBase64(saltB64)
    const subtle = getSubtle()
    const enc = new TextEncoder()
    const keyMaterial = await subtle.importKey('raw', enc.encode(plainText), 'PBKDF2', false, [
      'deriveBits',
      'deriveKey',
    ])
    const params = { name: 'PBKDF2', hash: DIGEST, salt, iterations }
    const derived = await subtle.deriveBits(params as any, keyMaterial, KEYLEN * 8)
    const out = toBase64(derived)
    // Constant-time comparison avoidance by comparing lengths and using early mismatch flag
    if (out.length !== hashB64.length) return false
    let mismatch = 0
    for (let i = 0; i < out.length; i++) mismatch |= out.charCodeAt(i) ^ hashB64.charCodeAt(i)
    return mismatch === 0
  } catch {
    return false
  }
}


