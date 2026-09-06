let wasmEncrypt = null;
let wasmDecrypt = null;

export async function loadCrypto() {
  try {
    const wasmUrl = new URL('wasm/vault_core.js', document.baseURI).href;
    const mod = await import(/* @vite-ignore */ wasmUrl);
    const instance = await mod.default();
    if (typeof instance.cwrap !== 'function') throw new Error('WASM module does not expose cwrap');
    wasmEncrypt = instance.cwrap('encrypt_json', 'string', ['string', 'string']);
    wasmDecrypt = instance.cwrap('decrypt_json', 'string', ['string', 'string']);
    return true;
  } catch (e) {
    wasmEncrypt = null;
    wasmDecrypt = null;
    console.warn('WASM vault not loaded; using WebCrypto fallback for MVP.', e);
    return false;
  }
}
async function deriveKey(secret) { const data = new TextEncoder().encode(secret); const digest = await crypto.subtle.digest('SHA-256', data); return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']) }
function hexToBytes(hex) { if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) throw new Error('Invalid vault ciphertext'); const bytes = new Uint8Array(hex.length / 2); for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16); return bytes }
export async function encryptJson(obj, secret) { const raw = JSON.stringify(obj); if (wasmEncrypt) { const encrypted = wasmEncrypt(raw, secret); if (!encrypted) throw new Error('WASM vault encryption failed'); return encrypted } const iv = crypto.getRandomValues(new Uint8Array(12)); const key = await deriveKey(secret); const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(raw)); return JSON.stringify({ v: 1, iv: Array.from(iv), data: Array.from(new Uint8Array(cipher)) }) }
export async function decryptJson(blob, secret) { const p = JSON.parse(blob); if (wasmDecrypt && typeof p.iv === 'string') { const decrypted = wasmDecrypt(blob, secret); if (!decrypted) throw new Error('WASM vault decryption failed'); return JSON.parse(decrypted) } const iv = typeof p.iv === 'string' ? hexToBytes(p.iv) : new Uint8Array(p.iv); const data = typeof p.data === 'string' ? hexToBytes(p.data) : new Uint8Array(p.data); const tag = typeof p.tag === 'string' ? hexToBytes(p.tag) : null; const cipher = tag ? new Uint8Array([...data, ...tag]) : data; const key = await deriveKey(secret); const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher); return JSON.parse(new TextDecoder().decode(plain)) }
