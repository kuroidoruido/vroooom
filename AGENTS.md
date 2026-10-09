# AGENTS.md - Rules for AI agents

This file contains the basic rules for working on this repo. For full details, see the [`/docs`](./docs/MAIN.md) folder.

## Technical stack

| Component | Technology | Justification |
|-----------|-------------|---------------|
| Web | Angular (PWA) | Responsive web interface, offline-first |
| Mobile | ng-native (Angular + Expo) | Unify stack with web, Android only MVP1 |
| Server | Rust | Performance, memory safety, lightweight REST API |
| Storage | Text files (hex) | No DB, backup via git, simple deployment |
| Encryption | XChaCha20-Poly1305 + Argon2id | Zero-knowledge, client-side only |

## Non-negotiable constraints

1. **Zero-knowledge mandatory** : The server must never be able to decrypt data. All encryption/decryption happens client-side.
2. **No DB** : No SQLite, PostgreSQL, MongoDB, etc. File storage only.
3. **Text storage** : Encrypted data is hex-encoded (not binary) for git compatibility.
4. **Local-first** : The app must work 100% offline. Sync only happens when the network is available.
5. **Password only** : The user only knows their username + password. No key to generate, no recovery key.

## Conventions

- **Language** : Code and comments in English, UI in French and English (i18n from MVP1). Default language: French, fallback: English.
- **License** : GPL v3 (open source, self-hosting encouraged).
- **Branches** : `main` (stable), `dev` (development), `feature/*` (new features).
- **Commits** : Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, etc.).

## Documentation

Any major architectural decision must be documented in `/docs` with the justification ("why"). See :

- [`docs/MAIN.md`](./docs/MAIN.md) - Overview
- [`docs/SECURITY.md`](./docs/SECURITY.md) - Security mechanisms
- [`docs/DATA.md`](./docs/DATA.md) - Data models and storage
- [`docs/ARCHI.md`](./docs/ARCHI.md) - Technical architecture
- [`docs/STACK.md`](./docs/STACK.md) - Tech stack (languages, frameworks, libraries)
- [`docs/BUSINESS.md`](./docs/BUSINESS.md) - Business rules
- [`docs/LEXICON.md`](./docs/LEXICON.md) - Definitions

## Server environment variables

- `FEATURE_ACCOUNT_CREATION=true|false` : Enables/disables creation of new accounts.

## Deployment

- Docker mandatory (see [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)).
- Volume mounted for `/data` (persistent storage of encrypted blobs).
- HTTPS mandatory (Let's Encrypt).
