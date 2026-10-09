# Security — Zero-knowledge model

## Table of contents

- [Threat model](#threat-model)
- [Zero-knowledge architecture](#zero-knowledge-architecture)
- [Key derivation (Argon2id)](#key-derivation-argon2id)
- [Encryption (XChaCha20-Poly1305)](#encryption-xchacha20-poly1305)
- [Hexadecimal storage format](#hexadecimal-storage-format)
- [Account creation flow](#account-creation-flow)
- [Login flow](#login-flow)
- [Password change flow](#password-change-flow)
- [Session management](#session-management)
- [Secure synchronization](#secure-synchronization)
- [Risk / mitigation summary](#risk--mitigation-summary)
- [Related documents](#related-documents)

---

## Threat model

| Threat | Description | Mitigation |
|--------|-------------|------------|
| **Compromised server** | The attacker accesses `/data` on the server | Encrypted blobs, server does not have the key. Salt + authHash exposed, but unusable without the password. |
| **MITM (man-in-the-middle)** | Network interception client ↔ server | HTTPS mandatory (Let's Encrypt). Even in case of MITM, blobs are encrypted. |
| **Stolen device** | Physical access to the phone/computer | Session in RAM only, erased when the app closes. No key persistence on unencrypted disk. OS lock recommended. |
| **Password loss** | User forgets their password | **No recovery possible.** Permanent data loss (assumed choice, like Bitwarden). |
| **Offline brute-force** | The attacker has blobs + salt + authHash | Argon2id (m=21 MiB, t=2, p=2) makes brute-force expensive (~0.5-3s per attempt on mobile). |
| **Online brute-force** | Login attempts on the API | Server-side rate limiting (to be implemented), FEATURE_ACCOUNT_CREATION to close registrations. |

---

## Zero-knowledge architecture

```mermaid
flowchart LR
    subgraph CLIENT["CLIENT (Angular)"]
        direction TB
        PWD[Password] --> ARGON[Argon2id<br/>(KDF)]
        ARGON --> KEY[MasterKey]
        KEY --> ENC[XChaCha20-Poly1305<br/>(encrypt/decrypt)]
    end

    subgraph SERVER["SERVER (Rust)"]
        direction TB
        DATA["/data/<br/>users/{hash}/<br/>*.enc<br/>username<br/>salt<br/>authHash"]
        NOTE["⚠️ Never receives:<br/>• MasterKey<br/>• plaintext password<br/>• decrypted data"]
    end

    ENC -->|"HTTPS + opaque<br/>hex blobs"| DATA
    DATA -.->|"salt (plaintext)<br/>for key re-derivation"| ARGON
```

**Invariant** : the server never receives the MasterKey, nor the plaintext password (outside TLS), nor any decrypted data.

---

## Key derivation (Argon2id)

### Parameters

| Parameter | Value | Justification |
|-----------|-------|---------------|
| Algorithm | Argon2id | Hybrid (Argon2i resistant to side-channel attacks + Argon2d resistant to GPU) |
| Memory (m) | 21 504 KiB (21 MiB) | Trade-off : expensive enough to slow down GPUs/ASICs, light enough to run on entry-level mobile |
| Iterations (t) | 2 | Doubles computation time without doubling memory |
| Parallelism (p) | 2 | Uses 2 cores on mobile, stays reasonable |
| Output length | 32 bytes (256 bits) | XChaCha20 key size |
| Salt | 16 random bytes | Unique per user, stored in plaintext server-side |

### Why these parameters

- **21 MiB** : an attacker with a GPU with 8 GiB of VRAM can only parallelize ~380 instances. With 1 GiB, ~48 instances. The cost per attempt becomes prohibitive.
- **t=2, p=2** : ~0.5–3 s of derivation on an average mobile. Acceptable for a login, deterrent for brute-force.
- **Argon2id** (vs Argon2d or Argon2i) : best trade-off GPU resistance / side-channel resistance.

### Calculation

```
MasterKey = Argon2id(
    password: user password (UTF-8),
    salt:     server salt (16 bytes, random),
    m:        21504,   // KiB
    t:        2,
    p:        2,
    dkLen:    32
)
```

---

## Encryption (XChaCha20-Poly1305)

### Why XChaCha20-Poly1305

| Criterion | XChaCha20-Poly1305 | AES-GCM (alternative) |
|-----------|-------------------|----------------------|
| Nonce size | 192 bits (24 bytes) | 96 bits (12 bytes) — collision risk if mismanaged |
| Mobile performance (ARM without AES-NI) | Excellent (fast software encryption) | Average (AES-NI absent on many mobile SoCs) |
| AEAD | Yes (built-in authentication) | Yes |
| Implementation simplicity | Yes (libsodium/libsodium.js) | Yes |

**Decision** : XChaCha20-Poly1305 because (1) 192-bit nonce eliminates the risk of accidental reuse, (2) superior performance on mobile without AES hardware acceleration.

### Encrypted blob format

```
hex( nonce[24] || ciphertext[N] || tag[16] )
```

| Field | Size | Role |
|-------|------|------|
| nonce | 24 bytes | Random unique number per encryption (never reused with the same key) |
| ciphertext | N bytes | Encrypted data (serialized JSON) |
| tag | 16 bytes | Poly1305 MAC (integrity + authenticity) |

The nonce is prefixed to the ciphertext : the server stores the complete blob without decomposing it.

---

## Hexadecimal storage format

### Why hexadecimal (and not binary)

| Criterion | Hexadecimal | Binary |
|-----------|-------------|--------|
| Git compatibility | ✅ Pure text, line-by-line readable diff | ❌ Binary files, unreadable diff |
| Backup | ✅ `git clone` or text copy | ❌ Specific tools |
| Debug/inspection | ✅ `cat`, `grep`, `wc` work | ❌ Requires `xxd`, `hexdump` |
| Size | 2× binary size | Reference |
| Corruption | ✅ Visually detectable (non-hex characters) | ⚠️ Checksum detection |

**Decision** : hexadecimal. The size overhead (2×) is negligible for blobs of a few KB. Git readability and backup simplicity take priority.

---

## Account creation flow

```
1. Client generates salt = random(16 bytes)
2. Client computes MasterKey = Argon2id(password, salt, m=21504, t=2, p=2)
3. Client computes authHash  = SHA256(MasterKey)
4. Client sends to server : { username, salt, authHash }
   → The server does NOT receive the password, NOT the MasterKey
5. Server stores : /data/users/{SHA256(username)}/
   ├── salt          (16 bytes, hex)
   └── authHash      (32 bytes, hex)
6. Client encrypts initial data (empty profile, etc.)
   with MasterKey → uploads .enc blobs
```

**Why SHA256(MasterKey) as authHash** : allows the server to verify a login without ever possessing the encryption key. SHA256 is irreversible (MasterKey = 256 random bits, no brute-force possible on authHash).

---

## Login flow

```
1. Client sends username to the server
2. Server responds : { salt, authHash }
   → salt allows re-deriving the key, authHash allows verification
3. Client computes MasterKey = Argon2id(password, salt, m=21504, t=2, p=2)
4. Client computes candidateHash = SHA256(MasterKey)
5. Client compares candidateHash == authHash
   → If different : failure, no information leaked
   → If identical : login successful
6. MasterKey stays in RAM memory only
7. Client downloads .enc blobs, decrypts them locally
```

**Why no server-side session token** : the server is stateless for authentication. Each sync request is authenticated by a simple mechanism (e.g. HMAC signature of the request with MasterKey, or authHash in header). The server verifies without ever decrypting.

---

## Password change flow

Changing the password involves a **complete re-encryption** of all data.

```
1. Client requests the old password → derives oldMasterKey
2. Client verifies oldMasterKey (via authHash)
3. Client enters the new password
4. Client generates newSalt = random(16 bytes)
5. Client derives newMasterKey = Argon2id(newPassword, newSalt)
6. Client downloads ALL .enc blobs
7. For each blob :
   a. Decrypts with oldMasterKey
   b. Re-encrypts with newMasterKey (new nonce)
   c. Uploads the new blob
8. Client computes newAuthHash = SHA256(newMasterKey)
9. Client sends { newSalt, newAuthHash } to the server
10. Server updates salt + authHash
11. oldMasterKey is erased from RAM
```

**Why re-encrypt** : if the old MasterKey has been compromised (e.g. keylogger at login time), changing the password without re-encrypting would leave the data readable with the old key. Re-encryption invalidates any previous copy of the blobs.

---

## Session management

| Aspect | Implementation | Why |
|--------|---------------|-----|
| Key storage | RAM only (JS/TS variable) | No persistence on unencrypted disk. App close = key lost. |
| Lifetime | Until app/tab close | UX/security trade-off. No "remember me" with persisted key. |
| Locking | The app locks if backgrounded > N minutes (configurable) | Stolen/borrowed device protection. |
| Erasure | `MasterKey.fill(0)` or equivalent on close | Avoids residue in swap/hibernate memory. |

**Why no encrypted key storage** : that would move the problem (where is the key encryption key stored?). The "RAM only" simplicity is safer and easier to audit.

---

## Secure synchronization

- All exchanges go through HTTPS (TLS 1.3 recommended).
- The server only sees opaque hexadecimal blobs.
- Metadata exposed server-side : file name (hash), size, mtime.
- **mtime** used for incremental sync : the business timestamp remains encrypted in the blob, only the filesystem mtime is in plaintext (necessary for change detection).
- No business data (amounts, mileage, VIN) is ever transmitted in plaintext.

---

## Risk / mitigation summary

| Risk | Severity | Mitigation | Status |
|------|----------|------------|--------|
| Compromised server (read /data) | Critical | Zero-knowledge, XChaCha20-Poly1305 encrypted blobs | ✅ Design |
| Network MITM | Critical | HTTPS mandatory (TLS 1.3) | ✅ Design |
| Stolen device (app open) | High | RAM only, auto-lock, key erasure | ✅ Design |
| Stolen device (app closed) | Medium | Encrypted blobs, no key on disk | ✅ Design |
| Password loss | High | No recovery (assumed choice), UI warning | ✅ Design |
| Offline brute-force (stolen blobs) | High | Argon2id m=21MiB t=2 p=2, unique salt | ✅ Design |
| Online brute-force (login) | Medium | Server rate limiting (to be implemented) | ⚠️ To do |
| Memory leak (MasterKey in RAM) | Medium | Explicit erasure, no key logging | ✅ Design |
| Nonce reuse | Critical | Random 192-bit nonce, never reused (libsodium) | ✅ By construction |
| Account deletion (GDPR) | Low | Delete /data/users/{hash}/ folder server-side | ⚠️ To be implemented |

---

## Related documents

- [MAIN.md](MAIN.md) — Project overview
- [DATA.md](DATA.md) — Blob format, server/local storage
- [ARCHI.md](ARCHI.md) — Technical architecture
- [API.md](API.md) — API endpoints (authentication)
- [DEPLOYMENT.md](DEPLOYMENT.md) — HTTPS, server configuration
- [LEXICON.md](LEXICON.md) — Definitions (AEAD, Argon2id, KDF, MasterKey, Nonce, Salt, XChaCha20, Zero-knowledge)

---

*Last updated : 2026-10-09*
