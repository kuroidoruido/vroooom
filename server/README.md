# vroooom-server

Zero-knowledge vehicle tracking server (Rust + Axum).

Stateless REST API that stores encrypted blobs as hex files. The server **never** decrypts user data.

## Development

```bash
# Copy env
cp .env.example .env

# Run (with auto-reload)
cargo watch -x run

# Run tests
cargo test

# Build release
cargo build --release
```

## Docker

```bash
# Build image
docker build -t vroooom-server .

# Or use docker-compose (from root)
docker compose up -d
```

See [STACK.md](../docs/STACK.md#1-server-rust) for details.
