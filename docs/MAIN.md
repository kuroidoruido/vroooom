# vroooom — Main documentation

## Table of contents

- [Overview](#overview)
- [Objectives](#objectives)
- [Technical stack](#technical-stack)
- [Guiding principles](#guiding-principles)
- [Related documents](#related-documents)

---

## Overview

**vroooom** is a vehicle tracking application : fuel, maintenance, expenses, mileage. **Zero-knowledge** architecture : the server can never read user data.

Typical use case : the user enters their fill-ups, the app calculates real consumption and projects annual costs.

---

## Objectives

### MVP1

| Feature | Description |
|---------|-------------|
| Vehicle CRUD | Add/edit/delete vehicles (VIN, brand, model, year, mileage) |
| Fill-up entry | Fuel type, amount, liters, mileage, full/partial |
| Expense tracking | Insurance, maintenance, toll, parking, fines, wash, credit, leasing, tax |
| Annual summary | Average consumption, cost per 100 km, total expenses by category |
| About screen | GPL v3 license, credits, version |
| Internationalization (i18n) | French and English UI, language switcher, auto-detection |
| Multi-device sync | Web (PWA) + Android (ng-native/Expo), local-first, conflict resolution |

### MVP2

| Feature | Description |
|---------|-------------|
| Leasing | Rent tracking, contractual mileage, overage alerts |
| Advanced maintenance | Oil change, tire, timing belt, inspection alerts by mileage/date |
| Advanced multi-vehicle | Comparisons between vehicles, cross-statistics |
| Export/import | Encrypted data export (manual backup) |

---

## Technical stack

| Component | Technology | Why |
|-----------|-------------|-----|
| Web | Angular (PWA) | Responsive interface, offline operation, single codebase |
| Mobile | ng-native (Angular + Expo) | Same stack as web, simplified Android deployment, no dual native expertise needed |
| Server | Rust | Performance, memory safety, small footprint, lightweight REST API |
| Server storage | Text files (hex) | No DB = reduced attack surface, trivial git backup, simplified deployment |
| Local storage | SQLite (expo-sqlite) / IndexedDB | Offline-first, structured queries client-side |
| Encryption | XChaCha20-Poly1305 + Argon2id | Zero-knowledge, GPU/ASIC resistance, built-in AEAD |
| Deployment | Docker | Reproducibility, self-hosting encouraged |
| License | GPL v3 | Open source, guaranteed self-hosting freedom |

---

## Guiding principles

### 1. Zero-knowledge mandatory

The server stores only encrypted blobs. It knows neither the content nor the structure of the data. All cryptography is client-side.

→ See [SECURITY.md](SECURITY.md)

### 2. No database

No PostgreSQL, SQLite, MongoDB on the server side. File storage only, hex-encoded for git compatibility.

→ See [DATA.md](DATA.md)

### 3. Local-first

The application works 100% offline. Synchronization only happens when the network is available. Local data is the primary source of truth.

### 4. Password only

The user only retains a username + password. No recovery key, no recovery key. Password loss = permanent data loss (like Bitwarden).

### 5. Open source (GPL v3)

Open code, self-hosting encouraged. The user can audit the code and host their own instance.

---

## Related documents

| Document | Content |
|----------|---------|
| [SECURITY.md](SECURITY.md) | Threat model, encryption, KDF, authentication flows |
| [DATA.md](DATA.md) | Data models, server/local storage, event sourcing, sync |
| [ARCHI.md](ARCHI.md) | Detailed technical architecture |
| [STACK.md](STACK.md) | **Tech stack (languages, frameworks, libraries per component)** |
| [BUSINESS.md](BUSINESS.md) | Business rules (consumption calculations, insurance, etc.) |
| [API.md](API.md) | Server REST API contract |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Docker deployment guide |
| [LEXICON.md](LEXICON.md) | Technical term definitions |
| [ROADMAP.md](ROADMAP.md) | Product roadmap |

---

*Last updated : 2026-10-09*
