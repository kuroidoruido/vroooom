# vroooom Documentation

> **Zero-knowledge vehicle tracking** — your data, your keys, your server.

Welcome to the official documentation for **vroooom**, an open-source (GPL v3) vehicle tracking application with a strict zero-knowledge architecture.

## What is vroooom?

vroooom helps you track:

- 🚗 **Vehicles** — VIN, brand, model, multi-fuel support (hybrid, E85)
- ⛽ **Fuel** — fill-ups, consumption (OBD vs calculated), price per liter
- 💰 **Expenses** — insurance, maintenance, tolls, parking, fines, leasing
- 📊 **Statistics** — annual summaries, cost per kilometer

## Key Principles

| Principle | Description |
|-----------|-------------|
| **Zero-Knowledge** | The server never sees your data. All encryption happens client-side. |
| **Local-First** | Works 100% offline. Syncs when network is available. |
| **No Database** | File-based storage (hex-encoded) for simple git backups. |
| **Open Source** | GPL v3. Self-host it yourself. |

## Quick Links

- [📖 Overview & Objectives](/MAIN)
- [🔒 Security Model](/SECURITY)
- [🏗️ Architecture](/ARCHI)
- [📊 Data Models](/DATA)
- [🚀 Deployment Guide](/DEPLOYMENT)
- [🛠️ Development Setup](/DEVELOPMENT)
- [❓ FAQ](/FAQ)

## Tech Stack

| Component | Technology |
|-----------|------------|
| Web | Angular (PWA) |
| Mobile | ng-native (Angular + Expo) |
| Server | Rust (REST API) |
| Storage | Files (hex-encoded, no DB) |
| Encryption | XChaCha20-Poly1305 + Argon2id |

---

**Ready to get started?** Head to the [Development Setup](/DEVELOPMENT) guide or explore the [Roadmap](/ROADMAP) to see what's coming.
