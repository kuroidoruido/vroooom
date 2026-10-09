# FAQ — Frequently Asked Questions

## General

### Why does this project exist ?

To have a **truly private** vehicle tracking application, where even the server host cannot read the data. Open source alternative to proprietary or cloud solutions.

### Why no database (PostgreSQL, MongoDB, etc.) ?

**Deployment simplicity** : a folder of text files is enough, backup via `git`, no external dependency.
**Zero-knowledge** : the server stores encrypted blobs, not queryable structured data.
**Easy self-hosting** : no need to install/configure a DB.

See [`docs/DATA.md`](DATA.md) for details.

### Why store in hexadecimal and not in binary ?

Git handles binary files poorly : no readable diff, no merge, repo size explodes.
Hexadecimal is text : line-by-line diff, readable backup, clean git history.

### Why zero-knowledge ?

**Privacy** : even if the server is compromised (hack, seizure, legal request), the data is unreadable without the password.
**Trust** : no need to trust the host (you can self-host, but even a compromised VPS sees nothing).

Model inspired by [Proton](https://proton.me) and [Bitwarden](https://bitwarden.com).

## Security

### What happens if I lose my password ?

**Your data is permanently lost.**

There is no "recovery key", no secret question, no support that can help you. This is the price of zero-knowledge : no one but you knows the decryption key.

*Advice* : use a password manager (Bitwarden, KeePass, 1Password) to store your vroooom password.

### Why Argon2id and not bcrypt/scrypt ?

Argon2id is the winner of the [Password Hashing Competition](https://www.password-hashing.net), resistant to GPU/ASIC attacks thanks to its high memory consumption.

Parameters used : `m=21MB, t=2, p=2` (mobile performance / security trade-off).

See [`docs/SECURITY.md`](SECURITY.md).

### Can the server see my data ?

**No.** The server only stores :
- Your username
- A random `salt` (public, harmless)
- An `authHash` = SHA256(master key) (allows verifying the password without knowing it)
- Encrypted blobs (hexadecimal unreadable without the master key)

The master key is derived from your password **only on your device** (phone/computer).

### What happens if someone steals my phone ?

Without your password, the data is unreadable. However, if the application was open (key in RAM), a sophisticated attacker could potentially extract the key from memory.

**Mitigation** : lock the application (lock screen with password/biometrics) after X minutes of inactivity. *Feature planned for MVP2.*

## Technical

### How does synchronization work ?

**Local-first** : you create/modify data locally (SQLite/IndexedDB encrypted). When the network comes back :
1. **Pull** : download expenses from other devices
2. **Conflict detection** : if 2 devices created an expense at the same time (same "parent"), the app detects the fork
3. **Resolution** : automatic (if different timestamps, sort by date) or manual (you choose)
4. **Push** : send your local expenses to the server

See [`docs/DATA.md`](DATA.md#sync) for details.

### Why a hash chain (git style) for IDs ?

To guarantee **integrity** : each expense contains the hash of the previous one. If the server (or an attacker) modifies an expense, the next hash no longer matches → immediate detection.

### What exactly is ng-native ?

Recent technology for making **native** mobile applications with **Angular** + **Expo** (like React Native but for Angular).

Advantage : same stack as web (Angular), possible code sharing.
Disadvantage : very recent, small community, to be tested in real conditions.

See [`docs/ARCHI.md`](ARCHI.md).

### Is it iOS compatible ?

**MVP1** : Android only (ng-native prioritizes Android).
**MVP2/Future** : iOS planned (Expo supports iOS, ng-native too eventually).

### Can I use vroooom without a server (local only) ?

**MVP1** : no, sync requires a server (even local, `localhost`).
**Future** : "local-only" mode planned (no account, no sync, device storage only).

## Deployment

### How much does it cost to host vroooom ?

The server is very lightweight (~10 MB RAM). A VPS at 4-5€/month is enough (Hetzner, OVH).
Or self-hosting on Raspberry Pi (free if you already have the hardware).

### Can I deploy without Docker ?

**Yes.** 3 documented options :
1. Docker Compose (recommended)
2. Plain Docker
3. Native binary (download + systemd)

See [`docs/DEPLOYMENT.md`](DEPLOYMENT.md).

## Contribution

### How to contribute ?

See the [CONTRIBUTING.md](https://github.com/kuroidoruido/vroooom/blob/main/CONTRIBUTING.md) on GitHub. Fork, `feature/*` branch, PR.

### Where is the source code ?

GitHub : [github.com/kuroidoruido/vroooom](https://github.com/kuroidoruido/vroooom) (to be created).
License : GPL v3 (open source).

---

## Related documents

- [MAIN.md](MAIN.md) — Overview
- [SECURITY.md](SECURITY.md) — Security details
- [DATA.md](DATA.md) — Models and storage
- [DEPLOYMENT.md](DEPLOYMENT.md) — Deployment guide
- [ROADMAP.md](ROADMAP.md) — Planned features
