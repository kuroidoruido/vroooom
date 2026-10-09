# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Complete documentation in `/docs` (MAIN, SECURITY, DATA, ARCHI, BUSINESS, API, DEPLOYMENT, ROADMAP, FAQ, TESTING, LEXICON)
- `AGENTS.md` for AI contribution rules
- Deployment guide (Docker Compose, plain Docker, native binary)
- Internationalization (i18n) support : French and English UI (MVP1), language switcher, auto-detection

### Changed
- No code changes yet (documentation phase)

## [0.1.0] - 2026-10-09

### Added
- Project initialization
- Zero-knowledge architecture definition
- Data model specification (Expense ADT, Vehicle, Profile)
- Technology choices : Angular (web), ng-native/Expo (mobile), Rust (server)
- Cryptographic parameters : Argon2id (21MB/2/2), XChaCha20-Poly1305
- Storage strategy : hex files, event sourcing, hash chaining
- GPL v3 license

---

## Change types

- `Added` : new features
- `Changed` : changes to existing features
- `Deprecated` : soon-to-be removed features
- `Removed` : removed features
- `Fixed` : bug fixes
- `Security` : vulnerability fixes
