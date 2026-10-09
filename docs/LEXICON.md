# Lexicon

Definitions of technical terms used in the **vroooom** documentation.

## Table of contents

- [A](#a) : [ADT](#adt-algebraic-data-type) — [AEAD](#aead-authenticated-encryption-with-associated-data) — [Argon2id](#argon2id)
- [B](#b) : [Blob](#blob)
- [E](#e) : [Event sourcing](#event-sourcing)
- [H](#h) : [Hash chain](#hash-chain) — [Hexadecimal](#hexadecimal)
- [I](#i) : [i18n](#i18n-internationalization)
- [K](#k) : [KDF](#kdf-key-derivation-function)
- [L](#l) : [Local-first](#local-first)
- [M](#m) : [MasterKey](#masterkey) — [mtime](#mtime)
- [N](#n) : [ng-native](#ng-native) — [Nonce](#nonce)
- [P](#p) : [Poly1305](#poly1305)
- [S](#s) : [Salt](#salt)
- [T](#t) : [Tombstone](#tombstone-soft-delete)
- [X](#x) : [XChaCha20](#xchacha20)
- [Z](#z) : [Zero-knowledge](#zero-knowledge)
- [Related documents](#related-documents)

---

## A

### ADT (Algebraic Data Type)

Sum type (union) combined with a product type (interface). In TypeScript : `type Expense = FuelExpense | InsuranceExpense | ...`. Each variant carries a discriminant (`kind`) that allows exhaustive filtering at compile time.

→ See [DATA.md — Expense](DATA.md#expense-adt)

### AEAD (Authenticated Encryption with Associated Data)

Authenticated encryption : guarantees both **confidentiality** (encryption) and **integrity/authenticity** (MAC tag) of the data, plus authentication of associated non-encrypted data (e.g. headers).

Examples : XChaCha20-Poly1305, AES-GCM.

→ See [SECURITY.md — Encryption](SECURITY.md#encryption-xchacha20-poly1305)

### Argon2id

Key derivation function (KDF) recommended by the Password Hashing Competition (2015). Hybrid version of Argon2 : combines the GPU attack resistance of Argon2d and the side-channel attack resistance of Argon2i.

vroooom parameters : m=21504 KiB (21 MiB), t=2, p=2.

→ See [SECURITY.md — Key derivation](SECURITY.md#key-derivation-argon2id)

---

## B

### Blob

In vroooom : encrypted binary file, hex-encoded, stored server-side. Contains nonce + ciphertext + tag. The server stores blobs without being able to read them.

→ See [SECURITY.md — Storage format](SECURITY.md#hexadecimal-storage-format) and [DATA.md — Server storage](DATA.md#server-storage)

---

## E

### Event sourcing

Storage pattern where the current state is rebuilt by replaying a sequence of immutable events. Each modification (add, update, delete) is a stored event, not an overwrite.

In vroooom : applied to the `Profile` (vehicles, preferences) via `profile-events/{id}.enc` + snapshot `profile.enc`.

→ See [DATA.md — Event sourcing](DATA.md#event-sourcing-profile)

---

## H

### Hash chain

Integrity scheme inspired by git/blockchain : each element carries a hash calculated from its content and the hash of its parent. Any modification breaks the chain and is detectable.

In vroooom : `id = SHA256(parentId || data || timestamp)` for each `ExpenseEnvelope`.

→ See [DATA.md — Hash chain](DATA.md#hash-chaining)

### Hexadecimal

Byte encoding in text using 16 characters (`0-9`, `a-f`). Each byte = 2 characters. Used to store encrypted blobs as plain text (git-compatible, readable diff, simple backup).

→ See [SECURITY.md — Storage format](SECURITY.md#hexadecimal-storage-format)

---

## I

### i18n (Internationalization)

System allowing the application to display its user interface in multiple languages. vroooom supports **French** (default) and **English**.

Implementation :
- **Web** : Angular i18n (native) or `@ngx-translate/core`, JSON translation files (`assets/i18n/fr.json`, `en.json`)
- **Mobile** : `expo-localization` + `i18n-js` or `react-i18next`, JSON translation files (`src/i18n/fr.json`, `en.json`)

Features : automatic language detection (browser/device locale), manual language switcher, fallback to English if translation missing, persistent choice (localStorage/AsyncStorage).

→ See [DEVELOPMENT.md — Internationalization](DEVELOPMENT.md#internationalization-i18n)

---

## K

### KDF (Key Derivation Function)

Function that derives a cryptographic key from a secret (password) and a salt. Designed to be **slow** (resist brute-force) and **deterministic** (same input = same output).

Examples : Argon2id, PBKDF2, scrypt, bcrypt.

→ See [SECURITY.md — Key derivation](SECURITY.md#key-derivation-argon2id)

---

## L

### Local-first

Architectural principle : the application works **100% offline**, local data is the primary source of truth. Synchronization with the server is secondary and opportunistic (when the network is available).

Advantages : zero latency, works without network, resilience.

→ See [MAIN.md — Guiding principles](MAIN.md#guiding-principles)

---

## M

### MasterKey

The user's main encryption key, derived only from the password via Argon2id. 256 bits (32 bytes). Used to encrypt/decrypt all blobs. **RAM only**, never persisted, never transmitted to the server.

→ See [SECURITY.md — Zero-knowledge architecture](SECURITY.md#zero-knowledge-architecture)

### mtime

**Modification time** : filesystem timestamp indicating the last modification of a file. In vroooom, used server-side for incremental synchronization (detecting which files have changed) without exposing the business timestamp (which remains encrypted in the blob).

→ See [DATA.md — Synchronization](DATA.md#synchronization)

---

## N

### ng-native

Framework/stack combining **Angular** and **Expo** (React Native) to produce native mobile applications from an Angular codebase. Allows sharing business logic between web (PWA) and mobile (Android/iOS) without learning Swift/Kotlin.

In vroooom : mobile MVP1 = Android only.

→ See [MAIN.md — Technical stack](MAIN.md#technical-stack)

### Nonce

**Number used once** : random value used only once in a cryptographic operation. In XChaCha20-Poly1305 : 24 bytes (192 bits) prefixed to the ciphertext. Reusing a nonce with the same key is catastrophic (loss of confidentiality).

→ See [SECURITY.md — Encryption](SECURITY.md#encryption-xchacha20-poly1305)

---

## P

### Poly1305

One-time key message authentication code (MAC), designed by Daniel J. Bernstein. Used as the authentication component in XChaCha20-Poly1305 (AEAD). Produces a 16-byte tag.

→ See [SECURITY.md — Encryption](SECURITY.md#encryption-xchacha20-poly1305)

---

## S

### Salt

Random unique value added to the password before derivation (KDF). Objectives : (1) prevent rainbow table attacks, (2) guarantee that two users with the same password have different keys.

In vroooom : 16 random bytes, stored **in plaintext** server-side (it is not a secret).

→ See [SECURITY.md — Account creation flow](SECURITY.md#account-creation-flow)

---

## T

### Tombstone (soft delete)

Deletion marker : instead of deleting data, a special record is created indicating "this data is deleted". Allows propagating deletion during synchronization (avoids the "resurrection" of locally deleted data that reappears from another device).

In vroooom : `Expense` of `kind: 'delete'` with `targetId` pointing to the deleted expense.

→ See [DATA.md — Soft delete](DATA.md#soft-delete-tombstone)

---

## X

### XChaCha20

Extended variant of ChaCha20 with a 192-bit (24-byte) nonce instead of 96 bits (12 bytes). The nonce extension drastically reduces the risk of accidental reuse. Fast stream cipher, particularly performant on mobile (ARM without AES-NI).

→ See [SECURITY.md — Encryption](SECURITY.md#encryption-xchacha20-poly1305)

---

## Z

### Zero-knowledge

Architecture where the **server cannot read user data**. All encryption/decryption happens client-side. The server stores opaque blobs and minimal metadata (salt, authHash).

"Zero-knowledge" = the service provider has zero knowledge of the content.

→ See [SECURITY.md — Architecture](SECURITY.md#zero-knowledge-architecture)

---

## Related documents

- [MAIN.md](MAIN.md) — Project overview
- [SECURITY.md](SECURITY.md) — Security, encryption, KDF
- [DATA.md](DATA.md) — Data models, storage, sync
- [ARCHI.md](ARCHI.md) — Technical architecture
- [BUSINESS.md](BUSINESS.md) — Business rules
- [API.md](API.md) — REST API contract
- [DEPLOYMENT.md](DEPLOYMENT.md) — Docker deployment

---

*Last updated : 2026-10-09*
