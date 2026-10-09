# Test strategy

Test strategy organized by component (brick by brick) :

1. **[Server (Rust)](#1-server-rust)** — API, storage, security
2. **[Shared Core](#2-shared-core-typescript)** — Crypto, types, sync logic (web + mobile)
3. **[Web App (Angular)](#3-web-app-angular)** — Components, services, E2E, PWA
4. **[Mobile App (ng-native)](#4-mobile-app-ng-native)** — Native components, services, E2E

Plus [cross-cutting concerns](#cross-cutting-concerns) (security, performance, CI/CD).

---

## Philosophy

| Principle | Implementation |
|-----------|----------------|
| **Security first** | Crypto code = 100% coverage. One flaw = total data compromise. |
| **Fast feedback** | Unit tests < 5s, integration < 30s, E2E < 5min. |
| **Test pyramid** | Many unit tests (fast), few integration tests, **minimal E2E** (smoke tests only). |
| **Automated mandatory** | Every commit must pass CI (GitHub Actions). |
| **No manual prod testing** | Deployment is reproducible and tested. |

### Test pyramid

```
        /\        E2E (smoke tests only)
       /  \       few tests, < 5min, critical flows only
      /____\      Playwright (web) / Maestro (mobile)
     /      \
    / Integr \    Integration tests
   /__________\   Component interactions, API contracts
  /            \
 /  Unit tests  \  80%+ coverage, < 5s
/________________\ Vitest / cargo test
```

**Why minimal E2E** :
- E2E tests are **slow** (minutes vs seconds)
- E2E tests are **flaky** (network, timing, rendering differences)
- E2E tests are **expensive to maintain** (UI changes break them)
- Unit/integration tests catch 95% of bugs faster

**E2E = Smoke tests** : Validate that the main user flow works (login → add data → see result). Everything else is covered by fast unit tests.

---

## 1. Server (Rust)

**Location :** `server/`
**Stack :** Rust + Axum (or Actix-web) + Tokio
**Coverage target :** 80%

### Test types

| Type | Tool | Scope |
|------|------|-------|
| Unit | `cargo test` | Storage, file I/O, path sanitization, auth logic |
| Integration | `cargo test` + HTTP | Full API endpoints (register, login, data CRUD, sync) |
| Security | Manual + `cargo audit` | Path traversal, injection, timing attacks |
| Performance | `criterion` | File read/write benchmarks |

### Unit tests

```rust
// server/src/storage.rs
#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_store_and_retrieve_blob() {
        let dir = tempdir().unwrap();
        let storage = Storage::new(dir.path());
        let user_id = "test_user";
        let blob_id = "abc123";
        let data = b"encrypted_data_hex";

        storage.store(user_id, blob_id, data).unwrap();
        let retrieved = storage.retrieve(user_id, blob_id).unwrap();

        assert_eq!(retrieved, data);
    }

    #[test]
    fn test_path_traversal_protection() {
        let dir = tempdir().unwrap();
        let storage = Storage::new(dir.path());

        // Attempt to escape with ../
        let result = storage.store("user", "../../etc/passwd", b"hack");
        assert!(result.is_err());

        // Attempt with absolute path
        let result = storage.store("user", "/etc/passwd", b"hack");
        assert!(result.is_err());
    }

    #[test]
    fn test_username_hash_consistency() {
        let hash1 = hash_username("alice");
        let hash2 = hash_username("alice");
        let hash3 = hash_username("bob");

        assert_eq!(hash1, hash2);
        assert_ne!(hash1, hash3);
    }
}
```

### Integration tests (API)

```rust
// server/tests/api_tests.rs
use axum::{
    body::Body,
    http::{Request, StatusCode},
    Router,
};
use tower::ServiceExt; // for `oneshot`

async fn test_app() -> Router {
    // Build the app with test storage
    create_app(StorageConfig::temp()).await
}

#[tokio::test]
async fn test_register_and_login_flow() {
    let app = test_app().await;

    // 1. Register
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/auth/register")
                .header("content-type", "application/json")
                .body(Body::from(r#"{"username":"alice","salt":"aabb","authHash":"ccdd"}"#))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::CREATED);

    // 2. Login (retrieve salt)
    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/auth/login")
                .header("content-type", "application/json")
                .body(Body::from(r#"{"username":"alice"}"#))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = hyper::body::to_bytes(response.into_body()).await.unwrap();
    let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(json["salt"], "aabb");
}

#[tokio::test]
async fn test_data_crud() {
    let app = test_app().await;

    // Store a blob
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("PUT")
                .uri("/api/data/vehicles/veh_123")
                .header("content-type", "application/json")
                .body(Body::from(r#"{"data":"deadbeef"}"#))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::CREATED);

    // Retrieve it
    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/data/vehicles/veh_123")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}
```

### Security tests

| Test | Method |
|------|--------|
| Path traversal | Unit test with `../../etc/passwd` |
| SQL injection | N/A (no SQL, but test filename sanitization) |
| Rate limiting | Integration test with 100 rapid requests |
| CORS | Verify `ALLOWED_ORIGINS` enforced |
| HTTPS redirect | Integration test (in staging) |

### Commands

```bash
cd server

# Unit + integration tests
cargo test

# With output
cargo test -- --nocapture

# Coverage
cargo tarpaulin --out Html --output-dir coverage

# Lint (strict)
cargo clippy -- -D warnings

# Format check
cargo fmt --check

# Benchmarks
cargo bench

# Security audit
cargo audit
```

---

## 2. Shared Core (TypeScript)

**Location :** `shared/`
**Stack :** TypeScript (pure, no framework)
**Used by :** Web (Angular) + Mobile (ng-native)
**Coverage target :** 100% for crypto, 90% for sync, 80% for types/utils

### Test types

| Type | Tool | Scope |
|------|------|-------|
| Unit | Vitest | Crypto, sync engine, hash chain, types, utils |
| Crypto vectors | Vitest + RFC test vectors | XChaCha20-Poly1305, Argon2id |
| Property-based | fast-check | Hash chain integrity, sync conflict resolution |

### Structure

```
shared/
├── src/
│   ├── crypto/
│   │   ├── argon2.ts
│   │   ├── xchacha20.ts
│   │   ├── index.ts
│   │   └── __tests__/
│   │       ├── argon2.spec.ts
│   │       └── xchacha20.spec.ts
│   ├── sync/
│   │   ├── engine.ts
│   │   ├── conflict.ts
│   │   ├── hash-chain.ts
│   │   └── __tests__/
│   │       ├── conflict.spec.ts
│   │       └── hash-chain.spec.ts
│   ├── types/
│   │   ├── expense.ts
│   │   ├── vehicle.ts
│   │   └── __tests__/
│   │       └── expense.spec.ts
│   └── utils/
│       └── __tests__/
└── package.json
```

### Crypto tests (mandatory 100%)

```typescript
// shared/src/crypto/__tests__/xchacha20.spec.ts
import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, deriveKey } from '../index';

describe('XChaCha20-Poly1305', () => {
  // RFC 8439 test vector
  it('should match RFC 8439 test vector', () => {
    const key = hexToBytes('808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9f');
    const nonce = hexToBytes('070000004041424344454647');
    const plaintext = "Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it.";
    const aad = hexToBytes('50515253c0c1c2c3c4c5c6c7');

    const { ciphertext, tag } = encrypt(key, nonce, plaintext, aad);

    expect(bytesToHex(ciphertext)).toBe('bd6d179d3e83d43b9576579493c0e939...');
    expect(bytesToHex(tag)).toBe('1ae10b594f09e96a...');
  });

  it('should decrypt correctly', () => {
    const key = randomBytes(32);
    const nonce = randomBytes(24);
    const plaintext = 'secret data';

    const encrypted = encrypt(key, nonce, plaintext);
    const decrypted = decrypt(key, encrypted.nonce, encrypted.ciphertext, encrypted.tag);

    expect(decrypted).toBe(plaintext);
  });

  it('should detect tampering (tag verification)', () => {
    const key = randomBytes(32);
    const encrypted = encrypt(key, randomBytes(24), 'secret');

    // Flip one bit in ciphertext
    encrypted.ciphertext[0] ^= 0x01;

    expect(() => decrypt(key, encrypted.nonce, encrypted.ciphertext, encrypted.tag))
      .toThrow();
  });

  it('should use unique nonce per encryption', () => {
    const key = randomBytes(32);
    const enc1 = encrypt(key, randomBytes(24), 'data');
    const enc2 = encrypt(key, randomBytes(24), 'data');

    expect(enc1.nonce).not.toEqual(enc2.nonce);
  });
});

describe('Argon2id', () => {
  it('should derive consistent key from same password + salt', async () => {
    const password = 'test-password';
    const salt = randomBytes(16);

    const key1 = await deriveKey(password, salt);
    const key2 = await deriveKey(password, salt);

    expect(key1).toEqual(key2);
  });

  it('should derive different keys for different passwords', async () => {
    const salt = randomBytes(16);

    const key1 = await deriveKey('password1', salt);
    const key2 = await deriveKey('password2', salt);

    expect(key1).not.toEqual(key2);
  });

  it('should use recommended parameters (21MB, 2 iterations, 2 parallelism)', async () => {
    // Verify config matches mobile constraints
    const config = getArgon2Config();
    expect(config.memory).toBe(21504); // 21 MB
    expect(config.iterations).toBe(2);
    expect(config.parallelism).toBe(2);
  });
});
```

### Sync engine tests

```typescript
// shared/src/sync/__tests__/conflict.spec.ts
import { describe, it, expect } from 'vitest';
import { detectFork, resolveByTimestamp } from '../conflict';
import type { ExpenseEnvelope } from '../../types';

describe('Conflict detection', () => {
  it('should detect fork when two expenses share the same parent', () => {
    const parent: ExpenseEnvelope = { id: 'A', parentId: null, timestamp: 1, data: { kind: 'fuel', amount: 50 } };
    const child1: ExpenseEnvelope = { id: 'B', parentId: 'A', timestamp: 2, data: { kind: 'fuel', amount: 60 } };
    const child2: ExpenseEnvelope = { id: 'C', parentId: 'A', timestamp: 3, data: { kind: 'toll', amount: 10 } };

    const expenses = [parent, child1, child2];
    const forks = detectFork(expenses);

    expect(forks).toHaveLength(1);
    expect(forks[0].parentId).toBe('A');
    expect(forks[0].children).toContain('B');
    expect(forks[0].children).toContain('C');
  });

  it('should resolve by timestamp (most recent wins)', () => {
    const child1 = { id: 'B', parentId: 'A', timestamp: 100, data: { kind: 'fuel' } };
    const child2 = { id: 'C', parentId: 'A', timestamp: 200, data: { kind: 'toll' } };

    const resolved = resolveByTimestamp([child1, child2]);

    expect(resolved.winner).toBe('C');
    expect(resolved.loser).toBe('B');
  });
});

describe('Hash chain', () => {
  it('should compute deterministic hash', () => {
    const expense = { kind: 'fuel', amount: 50, date: '2026-10-09' };
    const parentId = 'abc123';
    const timestamp = 1234567890;

    const hash1 = computeHash(parentId, expense, timestamp);
    const hash2 = computeHash(parentId, expense, timestamp);

    expect(hash1).toBe(hash2);
  });

  it('should detect tampering (hash mismatch)', () => {
    const expense = { kind: 'fuel', amount: 50 };
    const hash = computeHash(null, expense, 123);

    // Modify amount
    expense.amount = 100;
    const newHash = computeHash(null, expense, 123);

    expect(newHash).not.toBe(hash);
  });
});
```

### Commands

```bash
cd shared

# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Type check
npm run typecheck
```

---

## 3. Web App (Angular)

**Location :** `web/`
**Stack :** Angular 17+ (standalone components) + **Vitest** + Playwright
**Coverage target :** 80%

### Test types

| Type | Tool | Scope |
|------|------|-------|
| Unit | **Vitest** + TestBed | Components, services, guards, pipes |
| Integration | **Vitest** + TestBed | Component interactions, routing |
| E2E | Playwright | **Smoke tests only** (few tests, critical flows) |
| Accessibility | axe-core (via Playwright) | WCAG 2.1 AA compliance |
| PWA | Lighthouse CI | Service Worker, offline mode, installability |

### Unit tests (services)

```typescript
// web/src/app/core/services/crypto.service.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  let service: CryptoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CryptoService);
  });

  it('should derive key from password and salt', async () => {
    const key = await service.deriveKey('password', new Uint8Array(32));
    expect(key).toBeDefined();
    expect(key.length).toBe(32);
  });

  it('should encrypt and decrypt round-trip', async () => {
    const key = await service.deriveKey('password', new Uint8Array(32));
    const data = JSON.stringify({ test: 'data' });

    const encrypted = await service.encrypt(key, data);
    const decrypted = await service.decrypt(key, encrypted);

    expect(decrypted).toBe(data);
  });

  it('should fail decryption with wrong key', async () => {
    const key1 = await service.deriveKey('password1', new Uint8Array(32));
    const key2 = await service.deriveKey('password2', new Uint8Array(32));

    const encrypted = await service.encrypt(key1, 'secret');
    await expect(service.decrypt(key2, encrypted)).rejects.toThrow();
  });
});
```

### Unit tests (components)

```typescript
// web/src/app/features/vehicles/vehicle-list/vehicle-list.component.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VehicleListComponent } from './vehicle-list.component';

describe('VehicleListComponent', () => {
  let component: VehicleListComponent;
  let fixture: ComponentFixture<VehicleListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleListComponent] // standalone
    }).compileComponents();

    fixture = TestBed.createComponent(VehicleListComponent);
    component = fixture.componentInstance;
  });

  it('should display empty state when no vehicles', () => {
    component.vehicles = [];
    fixture.detectChanges();

    const el = fixture.nativeElement;
    expect(el.textContent).toContain('No vehicles yet');
  });

  it('should display vehicle cards', () => {
    component.vehicles = [
      { id: '1', brand: 'Peugeot', model: '208', year: 2023 }
    ];
    fixture.detectChanges();

    const el = fixture.nativeElement;
    expect(el.textContent).toContain('Peugeot 208');
    expect(el.textContent).toContain('2023');
  });

  it('should emit delete event when delete button clicked', () => {
    const vehicle = { id: '1', brand: 'Peugeot', model: '208' };
    component.vehicles = [vehicle];
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.delete, 'emit');

    const deleteBtn = fixture.nativeElement.querySelector('[data-testid="delete-vehicle"]');
    deleteBtn.click();

    expect(emitSpy).toHaveBeenCalledWith('1');
  });
});
```

### E2E tests (Playwright) — Smoke tests only

**Strategy** : E2E tests are **smoke tests only** — validate that critical features work end-to-end. Everything else is covered by unit/integration tests (faster).

**Target** : few tests max, run time < 2 minutes.

```typescript
// web/e2e/smoke.spec.ts
import { test, expect } from '@playwright/test';

// Reuse authenticated state (avoid login in every test)
test.use({ storageState: 'e2e/.auth/user.json' });

test.describe('Smoke tests — Critical flows', () => {

  test('1. User can register, login and see dashboard', async ({ page }) => {
    // Register
    await page.goto('/register');
    await page.fill('[data-testid="username"]', 'smoketest');
    await page.fill('[data-testid="password"]', 'test-password-123');
    await page.click('[data-testid="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('My vehicles');
  });

  test('2. User can add a vehicle and an expense', async ({ page }) => {
    await page.goto('/dashboard');

    // Add vehicle
    await page.click('[data-testid="add-vehicle"]');
    await page.fill('[data-testid="brand"]', 'Renault');
    await page.fill('[data-testid="model"]', 'Clio');
    await page.fill('[data-testid="year"]', '2023');
    await page.click('[data-testid="save"]');
    await expect(page.locator('[data-testid="vehicle-card"]')).toContainText('Renault Clio');

    // Add fuel expense
    await page.click('[data-testid="add-expense"]');
    await page.selectOption('[data-testid="kind"]', 'fuel');
    await page.fill('[data-testid="amount"]', '50.00');
    await page.fill('[data-testid="liters"]', '35.5');
    await page.click('[data-testid="save"]');
    await expect(page.locator('[data-testid="expense-list"]')).toContainText('50.00 €');
  });

  test('3. App works offline (PWA)', async ({ page, context }) => {
    // Load online first
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);
    await page.reload();

    // Should still load from Service Worker
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

**Playwright config** (`web/playwright.config.ts`) :
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 1, // Retry once on failure (CI only)
  workers: 2, // Parallel execution
  use: {
    baseURL: 'http://localhost:4200',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  // Only run smoke tests in CI (fast)
  grep: /@smoke/, // Tag smoke tests with @smoke
});
```

**What is NOT tested in E2E** (covered by unit tests) :
- Form validation (unit tests)
- Calculations (conso, totals) (unit tests)
- Encryption/decryption (unit tests in shared/)
- Sync conflict resolution (unit tests in shared/)
- Error handling (unit tests)

### Accessibility tests

```typescript
// web/e2e/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('homepage has no accessibility violations', async ({ page }) => {
  await page.goto('/');

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
```

### Commands

```bash
cd web

# Unit tests (Vitest)
npm test
# ou directement : npx vitest

# Watch mode
npx vitest --watch
# ou : npm run test:watch

# Coverage (Vitest + Istanbul)
npx vitest --coverage
# ou : npm run test:coverage

# UI mode (interface graphique)
npx vitest --ui

# E2E (Playwright)
npx playwright test
npx playwright test --ui  # Interactive mode

# Lint
npm run lint

# Build + Lighthouse
npm run build
npx lighthouse http://localhost:4200 --view
```

**Configuration Vitest pour Angular :**

```typescript
// web/vitest.config.ts
import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/main.ts']
    }
  }
});
```

---

## 4. Mobile App (ng-native)

**Location :** `mobile/` (created via `create-expo-app`)
**Stack :** ng-native (Angular + Expo) + **Vitest** + `@ng-native/testing`
**Coverage target :** 70% (native components harder to test than web DOM)

### What `@ng-native/testing` provides

ng-native tests run in **plain Node** (no simulator, no DOM). The library renders your Angular component onto a **fake Fabric** (in-memory stand-in for React Native's `nativeFabricUIManager`) and provides Testing Library APIs:

- `render()` — mounts component (like Angular Testing Library)
- `screen` — queries (`getByText`, `getByRole`, etc.) adapted for native views
- `userEvent` / `fireEvent` — interactions (press, type, etc.)
- `fabric` — access to the raw native tree (props, styles resolved)

**Key differences from web testing (no DOM, no TestBed) :**

| Concept | Web (Angular) | Mobile (ng-native) |
|---------|---------------|-------------------|
| TestBed | ✅ Yes | ❌ No — use `render()` directly |
| `ComponentFixture` | ✅ Yes | ❌ No — `render()` returns `{ componentRef, componentInstance, detectChanges }` |
| `nativeElement` | ✅ Yes | ❌ No — use `fabric` or `fabric.committed` |
| DOM queries | `querySelector` | `screen.getByText()`, `screen.getByRole()` |
| Test ID | `data-testid` | `testID` or `nativeID` prop |
| Layout | Real (CSS) | None (fake Fabric has no layout) |
| `detectChanges()` | Sync | **Async** (zoneless change detection) |

### Unit tests (components)

```typescript
// mobile/src/app/features/vehicles/vehicle-list.test.ts
import { render, screen, userEvent } from '@ng-native/testing';
import { describe, it, expect, vi } from 'vitest';
import { VehicleList } from './vehicle-list';

describe('VehicleList', () => {
  it('displays empty state when no vehicles', async () => {
    await render(VehicleList, {
      inputs: { vehicles: [] }
    });

    expect(screen.getByText('No vehicles yet')).toBeTruthy();
  });

  it('displays vehicle cards', async () => {
    await render(VehicleList, {
      inputs: {
        vehicles: [{ id: '1', brand: 'Peugeot', model: '208', year: 2023 }]
      }
    });

    expect(screen.getByText('Peugeot 208')).toBeTruthy();
    expect(screen.getByText('2023')).toBeTruthy();
  });

  it('emits delete event when delete button pressed', async () => {
    const onDelete = vi.fn();

    await render(VehicleList, {
      inputs: {
        vehicles: [{ id: '1', brand: 'Peugeot', model: '208' }],
        delete: onDelete
      }
    });

    const deleteBtn = screen.getByTestId('delete-vehicle');
    await userEvent.setup().press(deleteBtn);

    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('updates when vehicle added (rerender)', async () => {
    const result = await render(VehicleList, {
      inputs: { vehicles: [] }
    });

    expect(screen.getByText('No vehicles yet')).toBeTruthy();

    // Update inputs
    await result.rerender({
      inputs: {
        vehicles: [{ id: '1', brand: 'Renault', model: 'Clio' }]
      }
    });

    expect(screen.queryByText('No vehicles yet')).toBeNull();
    expect(screen.getByText('Renault Clio')).toBeTruthy();
  });
});
```

### Unit tests (services)

Services are tested like any TypeScript class (no TestBed needed):

```typescript
// mobile/src/app/services/sync.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SyncService } from './sync.service';

describe('SyncService', () => {
  let service: SyncService;

  beforeEach(() => {
    service = new SyncService();
  });

  it('should queue expenses when offline', () => {
    service.setOnline(false);
    service.addExpense({ kind: 'fuel', amount: 50 });

    expect(service.pendingCount).toBe(1);
  });

  it('should flush queue when back online', async () => {
    service.setOnline(false);
    service.addExpense({ kind: 'fuel', amount: 50 });

    service.setOnline(true);
    await service.sync();

    expect(service.pendingCount).toBe(0);
  });

  it('should detect conflicts on sync', async () => {
    const mockApi = {
      getExpenses: vi.fn().mockResolvedValue([
        { id: 'remote1', parentId: 'parent1', timestamp: 100 }
      ])
    };

    service.setApi(mockApi);
    service.setOnline(true);
    service.addExpense({ kind: 'fuel', amount: 60, parentId: 'parent1', timestamp: 200 });

    await service.sync();

    expect(service.conflicts.length).toBe(1);
  });
});
```

### E2E tests (Maestro) — Smoke tests only

**Strategy** : E2E tests are **smoke tests only** — validate the main user flow works on a real device. Everything else is covered by unit tests (faster, run in Node).

**Target** : 1-2 flows max, run time < 5 minutes.

```yaml
# mobile/e2e/flows/smoke.yaml
appId: com.vroooom.mobile
---
# Smoke test: Login + Add expense (main flow)
- launchApp
- tapOn: "Login"
- tapOn: "Username"
- inputText: "smoketest"
- tapOn: "Password"
- inputText: "test-password-123"
- tapOn: "Sign in"
- assertVisible: "My vehicles"

- tapOn: "Add expense"
- tapOn: "Kind"
- tapOn: "Fuel"
- tapOn: "Amount"
- inputText: "50.00"
- tapOn: "Liters"
- inputText: "35.5"
- tapOn: "Save"
- assertVisible: "50.00 €"
```

**What is NOT tested in E2E** (covered by unit tests in `@ng-native/testing`) :
- Component rendering (unit tests with fake Fabric)
- Form validation (unit tests)
- Calculations (unit tests in shared/)
- Encryption/decryption (unit tests in shared/)
- Sync conflict resolution (unit tests in shared/)
- Service logic (unit tests)

**When to add more E2E tests** :
- Before major releases (run full suite manually)
- When a bug is found that unit tests didn't catch
- For platform-specific features (iOS vs Android differences)

### Vitest configuration

```typescript
// mobile/vitest.config.ts
import { defineConfig } from 'vitest/config';
import { ngNative } from '@ng-native/testing/config';

export default defineConfig({
  plugins: [ngNative()],
  test: {
    globals: true,  // auto-cleanup after each test
    environment: 'node',  // no DOM needed
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts']
    }
  }
});
```

### Commands

```bash
cd mobile

# Unit tests (Vitest + @ng-native/testing)
npm test
# ou : npx vitest

# Watch mode
npx vitest --watch

# Coverage
npx vitest --coverage

# UI mode (browser-based test runner)
npx vitest --ui

# E2E (Maestro, requires device/emulator running)
maestro test e2e/flows/

# Run on Android (for manual testing)
npx expo run:android
```

### What unit tests do NOT cover

| Not covered | Why | Solution |
|-------------|-----|----------|
| Layout (Yoga) | Fake Fabric has no layout engine | E2E with Maestro |
| Native gestures | No real touch events | E2E with Maestro |
| Animations | UI thread not simulated | E2E or manual testing |
| Platform-specific rendering | iOS vs Android differences | E2E on both platforms |
| Performance (60fps) | No real rendering | Manual profiling with Xcode/Android Studio |

---

## Cross-cutting concerns

### Security testing (all components)

| Test | Component | Tool |
|------|-----------|------|
| Crypto vectors | Shared | Vitest + RFC 8439 |
| Dependency audit | All | `cargo audit`, `npm audit` |
| Secret scanning | All | `gitleaks`, GitHub secret scanning |
| OWASP ZAP | Web | Docker `owasp/zap2docker` |
| Path traversal | Server | Unit tests |
| MITM | All | Wireshark/Charles proxy |

**Security checklist (manual, before release) :**

- [ ] Password never transits in plaintext (verify with Wireshark)
- [ ] Blobs are encrypted at rest (open `/data` files, verify hex gibberish)
- [ ] Salt is unique per user
- [ ] Nonce is unique per encryption
- [ ] No sensitive data in logs (password, key, decrypted data)
- [ ] HTTPS enforced (TLS 1.3)
- [ ] Rate limiting on `/api/auth/login`
- [ ] Path traversal impossible (`../../etc/passwd`)
- [ ] MasterKey never persisted (check localStorage/AsyncStorage)
- [ ] SQL injection N/A (verify no raw SQL in expo-sqlite)

### Performance testing

| Component | Tool | Target |
|-----------|------|--------|
| Server | `criterion` benchmarks | < 10ms per blob write |
| Web | Lighthouse CI | Performance > 90, PWA > 90 |
| Mobile | `npx expo export` + bundle analyzer | Bundle < 5 MB |
| Crypto | Vitest benchmarks | Argon2id < 2s on mid-range phone |
| Sync | Integration tests | < 500ms for 100 expenses |

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test-server:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: cd server && cargo test
      - run: cd server && cargo clippy -- -D warnings
      - run: cd server && cargo fmt --check

  test-shared:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd shared && npm ci
      - run: cd shared && npm test -- --coverage

  test-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd web && npm ci
      - run: cd web && npm test -- --coverage  # Unit tests (fast, every PR)
      - run: cd web && npm run lint
      # E2E smoke tests: only on main branch (slow, ~2min)
      # To keep CI fast, E2E runs only on main, not on every PR
      - if: github.ref == 'refs/heads/main'
        run: cd web && npx playwright install && npm run e2e

  test-mobile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd mobile && npm ci
      - run: cd mobile && npm test  # Unit tests only (fast, every PR)
      # E2E Maestro: manual trigger only (requires Android emulator on CI)
      # Run with: gh workflow run ci.yml -f run_e2e=true
      # Or locally: maestro test mobile/e2e/flows/

  # Optional: E2E mobile (manual trigger, requires Android emulator)
  test-mobile-e2e:
    runs-on: ubuntu-latest
    if: github.event_name == 'workflow_dispatch'  # Manual trigger only
    steps:
      - uses: actions/checkout@v4
      - uses: react-native-community/setup-android@v1  # Setup Android emulator
      - run: cd mobile && npm ci
      - run: npx expo run:android --variant debug  # Build and install on emulator
      - run: maestro test mobile/e2e/flows/

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions-rs/audit-check@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      - run: cd web && npm audit --audit-level=high
      - run: cd mobile && npm audit --audit-level=high
      - run: cd shared && npm audit --audit-level=high
```

### Coverage targets

| Component | Target | Tool |
|-----------|--------|------|
| Server (Rust) | 80% | `cargo tarpaulin` |
| Shared Core | **100% crypto, 90% sync** | Vitest + Istanbul |
| Web (Angular) | 80% | Vitest + Istanbul |
| Mobile (ng-native) | 70% | Vitest |

---

## Related documents

- [SECURITY.md](SECURITY.md) — Security implementation to test
- [DATA.md](DATA.md) — Data models and storage
- [DEVELOPMENT.md](DEVELOPMENT.md) — Environment setup
- [ARCHI.md](ARCHI.md) — Architecture overview
- [API.md](API.md) — REST API endpoints
