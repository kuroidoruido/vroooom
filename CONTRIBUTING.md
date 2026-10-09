# Contributing to vroooom

Thank you for your interest! This guide explains how to contribute to the project.

## Philosophy

- **Zero-knowledge above all** : no user data must be readable by the server
- **Simplicity** : no DB, file storage, clear code
- **Open source** : GPL v3, full transparency

## Prerequisites

See [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) for the full setup.

- Rust 1.75+ (server)
- Node.js 20+ (web/mobile)
- Angular CLI
- Expo CLI (mobile)

## Workflow

### 1. Fork & Clone

```bash
git clone https://github.com/YOUR-USERNAME/vroooom.git
cd vroooom
git remote add upstream https://github.com/kuroidoruido/vroooom.git
```

### 2. Create a branch

```bash
git checkout -b feature/my-feature
# or
fix/my-bug
```

### 3. Develop

- Follow code conventions (see below)
- Add tests (see [`docs/TESTING.md`](docs/TESTING.md))
- Update documentation if needed (`/docs`)

### 4. Commit

Use **Conventional Commits** :

```bash
git commit -m "feat: add leasing tracking"
git commit -m "fix: fix consumption calculation"
git commit -m "docs: update SECURITY.md"
git commit -m "refactor: simplify sync engine"
git commit -m "test: add crypto tests"
```

Types : `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

### 5. Push & Pull Request

```bash
git push origin feature/my-feature
```

Open a PR on GitHub with :
- Clear description of the change
- Link to the issue (if applicable)
- Screenshots (if UI)
- Tests passing checklist

## Code conventions

### TypeScript / Angular

- `strict` mode enabled
- Standalone components (Angular 17+)
- Injectable services for business logic
- No `any`, use strict types
- Naming : `camelCase` for variables/functions, `PascalCase` for classes

### Rust

- `cargo fmt` and `cargo clippy` mandatory before commit
- No `unwrap()` in production (use `?` or `match`)
- `///` documentation for public functions
- Unit tests in the same file (`#[cfg(test)]`)

### Git

- Branches : `main` (stable), `dev` (integration), `feature/*`, `fix/*`
- No direct commit on `main`
- Rebase rather than merge to keep a linear history

## Tests

Before submitting a PR, verify that :

```bash
# Rust server
cd server && cargo test && cargo clippy && cargo fmt --check

# Web Angular
cd web && npm test && npm run lint

# Mobile (if applicable)
cd mobile && npm test
```

See [`docs/TESTING.md`](docs/TESTING.md) for the full strategy.

## Documentation

Any new feature must be documented in `/docs` :
- Update `BUSINESS.md` if business rule
- Update `API.md` if new endpoint
- Update `DATA.md` if model change
- Update `SECURITY.md` if security impact

## Code Review

PRs are reviewed on :
- Security (zero-knowledge respected?)
- Code quality (readability, tests, performance)
- Consistency with existing architecture
- Up-to-date documentation

## Questions ?

Open an [issue](https://github.com/kuroidoruido/vroooom/issues) or contact the author.

---

*Thank you for contributing to making vroooom better!*
