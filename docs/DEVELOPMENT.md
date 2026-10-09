# Local development

Guide for setting up the development environment and running vroooom locally.

## Table of contents

- [Prerequisites](#prerequisites)
- [Repo structure](#repo-structure)
- [Rust server](#rust-server)
- [Web (Angular)](#web-angular)
- [Mobile (ng-native / Expo)](#mobile-ng-native--expo)
- [Environment variables](#environment-variables)
- [Useful commands](#useful-commands)
- [Debug](#debug)

---

## Prerequisites

| Tool | Version | Installation |
|------|---------|--------------|
| Rust | 1.99+ | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Node.js | 20+ | `nvm install 20` or [nodejs.org](https://nodejs.org) |
| Angular CLI | 17+ | `npm install -g @angular/cli` |
| Expo CLI | latest | `npm install -g expo-cli` |
| Docker | 24+ | [get.docker.com](https://get.docker.com) (optional, for tests) |

## Repo structure

```
vroooom/
├── AGENTS.md              # Rules for AI agents
├── README.md              # Presentation
├── LICENSE                # GPL v3
├── CONTRIBUTING.md        # Contribution guide
├── CHANGELOG.md           # History
├── docs/                  # Complete documentation
│   ├── MAIN.md
│   ├── SECURITY.md
│   ├── DATA.md
│   ├── ARCHI.md
│   ├── BUSINESS.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT.md     # This file
│   ├── ROADMAP.md
│   ├── FAQ.md
│   ├── TESTING.md
│   └── LEXICON.md
├── server/                # Rust server (REST API)
│   ├── Cargo.toml
│   ├── src/
│   └── Dockerfile
├── web/                   # Web application (Angular PWA)
│   ├── package.json
│   ├── angular.json
│   └── src/
├── mobile/                # Mobile app (ng-native / Expo)
│   ├── src/
│   │   └── app/
│   │       └── app.ts     # Root Angular component
│   ├── package.json       # Created by create-expo-app
│   ├── app.json           # Expo config
│   ├── metro.config.js    # Metro bundler (Angular preset)
│   └── assets/            # Images, fonts
└── shared/                # Shared code (types, crypto, utils)
    ├── types/             # TypeScript models (Expense, Vehicle, etc.)
    ├── crypto/            # Encryption functions (Argon2, XChaCha20)
    └── sync/              # Synchronization logic
```

## Rust server

### Run in dev

```bash
cd server

# Environment variables (dev)
export FEATURE_ACCOUNT_CREATION=true
export DATA_DIR=./data-dev
export PORT=8080
export RUST_LOG=debug

# Run (with auto-reload if cargo-watch installed)
cargo watch -x run
# or simply
cargo run
```

The server starts on `http://localhost:8080`.

### Create the data folder

```bash
mkdir -p server/data-dev/users
```

### Tests

```bash
cargo test
cargo clippy
cargo fmt --check
```

## Web (Angular)

### Installation

```bash
cd web
npm install
```

### Run in dev

```bash
ng serve
# or
npm start
```

The application is accessible on `http://localhost:4200`.

### Production build

```bash
ng build --configuration production
# Files are in dist/vroooom-web/
```

### PWA (Service Worker)

In dev, the Service Worker is disabled by default. To test :

```bash
ng serve --configuration development --service-worker
```

## Mobile (ng-native / Expo)

ng-native is built on **Expo** with a specific Angular template. It renders native iOS/Android views (no React in the render path).

### Create the app (first time)

```bash
# From the repo root, create the mobile app
npx create-expo-app@latest mobile --template @ng-native/template
cd mobile
```

This creates a standard Expo project with:
- `src/app/app.ts` — root Angular component
- `metro.config.js` — Metro bundler configured for Angular
- `package.json` — dependencies pre-installed

### Run

```bash
cd mobile
npx expo start
```

Then choose:
- **`a`** — Open on Android emulator/device (via Expo Go)
- **`i`** — Open on iOS simulator (macOS only)
- **Scan QR code** — Open on physical device with Expo Go app

**Hot reload** : Edit `src/app/app.ts` and save → the app updates instantly on the device (state is preserved for template/style changes).

### Native components

ng-native provides native components (not HTML). Import from `@ng-native/components`:

```typescript
import { Component, signal } from '@angular/core';
import { View, Text, Pressable, SafeAreaView } from '@ng-native/components';

@Component({
  selector: 'app-root',
  imports: [View, Text, Pressable, SafeAreaView],
  template: `
    <safe-area-view>
      <view class="container">
        <text class="title">vroooom</text>
        <pressable (press)="count.set(count() + 1)">
          <text>Tapped {{ count() }} times</text>
        </pressable>
      </view>
    </safe-area-view>
  `,
  styles: `
    .container { flex: 1; justify-content: center; padding: 24px; }
    .title { font-size: 28px; font-weight: bold; }
  `
})
export class App {
  count = signal(0);
}
```

**Important** : Use **lowercase** element names (`<view>`, `<text>`, not `<View>`, `<Text>`). Angular treats uppercase as unknown components.

### Tests

```bash
cd mobile
npm test
```

Uses **Vitest** + `@ng-native/testing` (renders against a fake native host, no simulator needed).

### Build APK (local)

```bash
# Debug build (runs on device/emulator)
npx expo run:android

# Release build (APK)
npx expo run:android --variant release
# APK in android/app/build/outputs/apk/release/
```

### Android prerequisites

- Android Studio installed
- Android emulator configured, OR physical device with **Expo Go** app
- `ANDROID_HOME` environment variable set

### iOS (macOS only, future)

```bash
npx expo run:ios
```

### EAS Build (cloud build)

For CI/CD or release distribution:

```bash
npx eas build --platform android
```

See [Expo EAS Build docs](https://docs.expo.dev/build/introduction/).

### Local storage (expo-sqlite)

ng-native projects include `expo-sqlite` for local storage. Schema is the same as web (see [DATA.md — Local storage](DATA.md#local-storage)), but all sensitive data must be encrypted before insertion (MasterKey in RAM only).

```typescript
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('vroooom.db');

// Store encrypted blob
db.runSync(
  'INSERT INTO expenses (id, kind, date, encrypted_data, dirty) VALUES (?, ?, ?, ?, 1)',
  [expenseId, 'fuel', '2026-10-09', encryptedHex]
);
```

## Environment variables

### Server (`.env` or export)

```bash
# server/.env (to create)
FEATURE_ACCOUNT_CREATION=true    # true in dev, false in prod
DATA_DIR=./data-dev              # Local storage folder
PORT=8080
RUST_LOG=debug                   # debug in dev, info in prod
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:8081  # CORS dev
```

### Web (`src/environments/environment.ts`)

```typescript
// src/environments/environment.development.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  argon2: {
    memory: 21504,  // 21 MB (identical to prod mobile)
    iterations: 2,
    parallelism: 2
  }
};
```

### Mobile (`app.json` or `expo-constants`)

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://10.0.2.2:8080/api",
      "argon2": {
        "memory": 21504,
        "iterations": 2,
        "parallelism": 2
      }
    }
  }
}
```

**Access in code** (ng-native / Expo):

```typescript
import Constants from 'expo-constants';

const apiUrl = Constants.expoConfig?.extra?.apiUrl;
const argon2Memory = Constants.expoConfig?.extra?.argon2?.memory || 21504;
```

**Note** : `10.0.2.2` is the host IP from the Android emulator. On a physical device, use the PC's local IP (`192.168.x.x`).

## Internationalization (i18n)

The app supports **French** (default) and **English**.

### Web (Angular)

Uses Angular's built-in i18n or `@ngx-translate/core`.

**Translation files structure:**
```
web/src/assets/i18n/
  fr.json    # French (default)
  en.json    # English (fallback)
```

**Example `fr.json`:**
```json
{
  "app": {
    "title": "vroooom",
    "tagline": "Suivi de véhicule zero-knowledge"
  },
  "nav": {
    "vehicles": "Véhicules",
    "expenses": "Dépenses",
    "settings": "Paramètres"
  },
  "actions": {
    "add": "Ajouter",
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer"
  }
}
```

**Language detection:**
- Browser language (`navigator.language`) on first visit
- Stored in `localStorage` (`vroooom-lang`)
- Manual switcher in Settings

### Mobile (ng-native / Expo)

Uses `expo-localization` + `i18n-js` or `react-i18next`.

**Translation files structure:**
```
mobile/src/i18n/
  fr.json
  en.json
  index.ts    # i18n configuration
```

**Language detection:**
- Device locale (`expo-localization`) on first launch
- Stored in AsyncStorage
- Manual switcher in Settings

### Adding a new language

1. Copy `fr.json` to `xx.json` (e.g., `de.json` for German)
2. Translate all keys
3. Add locale to `SUPPORTED_LANGUAGES` constant
4. Update language switcher UI
5. Test fallback behavior (missing keys → English → French)

### Translation keys conventions

- Use nested objects by feature/page: `vehicles.list.title`, `expenses.form.amount`
- Use UPPER_SNAKE_CASE for constants: `FUEL_TYPES.GASOLINE`
- Keep keys stable (don't rename, deprecate instead)

## Documentation site (VitePress)

The documentation in `/docs` can be viewed as a website with hot reload:

```bash
cd docs
npm install          # First time only
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build static site (docs/.vitepress/dist/)
npm run preview      # Preview the built site
```

**Features :**
- Hot reload on Markdown changes
- Mermaid diagrams support (all schemas render automatically)
- Static Site Generation (SSG) for deployment
- Search functionality (built-in)

**Deploy the docs :** build with `npm run build` and serve `docs/.vitepress/dist/` with any static file server (or integrate into the Rust server).

---

## Useful commands

### All at once (multiple terminals)

```bash
# Terminal 1 : Server
cd server && cargo run

# Terminal 2 : Web
cd web && ng serve

# Terminal 3 : Mobile
cd mobile && npx expo start
```

### Or with `concurrently` (root package.json)

```bash
npm run dev  # Launches all 3 in parallel
```

### Full reset

```bash
# Delete dev data
rm -rf server/data-dev

# Delete node_modules
rm -rf web/node_modules mobile/node_modules

# Reinstall web
cd web && npm install

# Reinstall mobile (if mobile/ folder still exists)
cd ../mobile && npm install

# OR recreate mobile from scratch (if deleted)
cd ..
rm -rf mobile
npx create-expo-app@latest mobile --template @ng-native/template
```

## Debug

### Rust server

```bash
# Detailed logs
RUST_LOG=trace cargo run

# Debug with lldb/gdb
cargo build
lldb target/debug/vroooom-server
```

### Web Angular

- Chrome DevTools (F12)
- Angular DevTools (Chrome extension)
- Redux DevTools (if NgRx is used)

### Mobile Expo

```bash
# Android logs
npx expo run:android
adb logcat | grep -i vroooom

# Or
npx react-native log-android
```

### Crypto (test encryption/decryption)

Create a temporary test file :

```typescript
// shared/crypto/test.ts
import { deriveKey, encrypt, decrypt } from './index';

const password = 'test-password';
const salt = crypto.getRandomValues(new Uint8Array(32));

const key = await deriveKey(password, salt);
const data = JSON.stringify({ test: 'hello' });
const encrypted = await encrypt(key, data);
const decrypted = await decrypt(key, encrypted);

console.log('Original:', data);
console.log('Decrypted:', decrypted);
console.assert(data === decrypted, 'Decryption failed!');
```

Run with `npx ts-node test.ts` or in a Vitest test.

---

## Related documents

- [ARCHI.md](ARCHI.md) — Technical architecture
- [API.md](API.md) — API endpoints (to test with curl/Postman)
- [TESTING.md](TESTING.md) — Test strategy
- [SECURITY.md](SECURITY.md) — Crypto implementation
- [DEPLOYMENT.md](DEPLOYMENT.md) — Production deployment
