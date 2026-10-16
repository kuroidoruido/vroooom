/**
 * @vroooom/shared — Shared core library
 *
 * Exports:
 * - Types (Expense, Vehicle, Profile)
 * - Crypto (Argon2id, XChaCha20-Poly1305, SHA-256)
 * - Sync engine (hash chain, conflict resolution)
 * - Utils (hex, date, id)
 * - Version info
 */

// Types
export * from './types/index.js';

// TODO: Re-enable when libsodium-wrappers ESM issue is fixed
// Crypto
// export * from './crypto/index.js';

// Sync
// export * from './sync/index.js';

// Utils
export * from './utils/index.js';

// Version
export * from './version.js';
