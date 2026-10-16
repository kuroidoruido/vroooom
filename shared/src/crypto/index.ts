/**
 * Crypto module — XChaCha20-Poly1305, Argon2id, SHA-256
 *
 * Uses libsodium.js (WASM) and argon2-browser.
 * All functions are async (WASM initialization).
 */

import _sodium from 'libsodium-wrappers';
import argon2 from 'argon2-browser';
import { sha256 } from '@noble/hashes/sha256';

// Re-export for convenience
export { sha256 };

let sodiumReady: Promise<typeof _sodium> | null = null;

async function getSodium(): Promise<typeof _sodium> {
  if (!sodiumReady) {
    sodiumReady = _sodium.ready;
  }
  return sodiumReady;
}

/**
 * Derive MasterKey from password using Argon2id
 * Parameters: m=21MB (21504 KiB), t=2, p=2 (mobile-optimized)
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<Uint8Array> {
  const result = await argon2.hash({
    pass: password,
    salt: salt,
    mem: 21504, // 21 MB
    time: 2,
    parallelism: 2,
    hashLen: 32,
    type: argon2.ArgonType.Argon2id,
  });

  return new Uint8Array(result.hash);
}

/**
 * Compute authHash = SHA256(MasterKey) for server verification
 */
export function computeAuthHash(masterKey: Uint8Array): string {
  const hash = sha256(masterKey);
  return bytesToHex(hash);
}

/**
 * Encrypt data with XChaCha20-Poly1305
 * Returns: nonce (24 bytes) + ciphertext + tag (16 bytes)
 */
export async function encrypt(
  key: Uint8Array,
  plaintext: string
): Promise<{ nonce: Uint8Array; ciphertext: Uint8Array; tag: Uint8Array }> {
  const sodium = await getSodium();
  const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
  const message = sodium.from_string(plaintext);

  const encrypted = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    message,
    null, // no additional data
    null, // no nonce (auto-generated)
    nonce,
    key
  );

  // encrypted = ciphertext + tag (16 bytes)
  const ciphertext = encrypted.slice(0, -sodium.crypto_aead_xchacha20poly1305_ietf_ABYTES);
  const tag = encrypted.slice(-sodium.crypto_aead_xchacha20poly1305_ietf_ABYTES);

  return { nonce, ciphertext, tag };
}

/**
 * Decrypt data with XChaCha20-Poly1305
 * Throws if tag verification fails (tampering detected)
 */
export async function decrypt(
  key: Uint8Array,
  nonce: Uint8Array,
  ciphertext: Uint8Array,
  tag: Uint8Array
): Promise<string> {
  const sodium = await getSodium();

  // Recombine ciphertext + tag
  const encrypted = new Uint8Array(ciphertext.length + tag.length);
  encrypted.set(ciphertext);
  encrypted.set(tag, ciphertext.length);

  const decrypted = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null,
    encrypted,
    null, // no additional data
    nonce,
    key
  );

  return sodium.to_string(decrypted);
}

/**
 * Generate secure random bytes
 */
export function randomBytes(length: number): Uint8Array {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint8Array(length));
  }
  throw new Error('Secure random not available');
}

// Hex utils
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Combine nonce + ciphertext + tag into a single hex string for storage
 */
export function encryptToHex(
  key: Uint8Array,
  plaintext: string
): Promise<string> {
  return encrypt(key, plaintext).then(({ nonce, ciphertext, tag }) => {
    const combined = new Uint8Array(nonce.length + ciphertext.length + tag.length);
    combined.set(nonce, 0);
    combined.set(ciphertext, nonce.length);
    combined.set(tag, nonce.length + ciphertext.length);
    return bytesToHex(combined);
  });
}

/**
 * Decrypt from a hex string (nonce + ciphertext + tag)
 */
export async function decryptFromHex(
  key: Uint8Array,
  hex: string
): Promise<string> {
  const bytes = hexToBytes(hex);
  const nonce = bytes.slice(0, 24);
  const tag = bytes.slice(-16);
  const ciphertext = bytes.slice(24, -16);
  return decrypt(key, nonce, ciphertext, tag);
}
