# @vroooom/shared

Shared core library (TypeScript):
- **Types** — Expense ADT, Vehicle, Profile
- **Crypto** — Argon2id, XChaCha20-Poly1305, SHA-256 (libsodium.js + argon2-browser)
- **Sync** — Hash chain, conflict detection/resolution
- **Utils** — Hex, date, id helpers

Consumed by:
- `@vroooom/web` (Angular)
- `@vroooom/mobile` (ng-native)

## Development

```bash
# From root
npm run dev -w shared      # Watch mode
npm run build -w shared    # Build (tsup)
npm run test -w shared     # Tests (vitest)
npm run lint -w shared     # Lint (biome)
```

See [STACK.md](../docs/STACK.md#2-shared-core-typescript) for details.
