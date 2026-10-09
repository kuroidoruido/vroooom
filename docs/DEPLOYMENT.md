# Deployment

## Table of contents

- [Choosing a method](#choosing-a-method)
- [Prerequisites](#prerequisites)
- [Option 1 : Docker Compose (recommended)](#option-1--docker-compose-recommended)
- [Option 2 : Plain Docker](#option-2--plain-docker)
- [Option 3 : Native binary](#option-3--native-binary)
- [Environment variables](#environment-variables)
- [HTTPS mandatory](#https-mandatory)
- [Backup](#backup)
- [Server security](#server-security)
- [Self-hosting](#self-hosting)
- [Related documents](#related-documents)

---

## Choosing a method

| Method | Complexity | HTTPS | Isolation | Recommended for | Why |
|--------|------------|-------|-----------|-----------------|-----|
| **Docker Compose** | Medium | ✅ Built-in (Nginx + Certbot) | ✅ Containers | Production, beginners | All-in-one, auto SSL renewal, enhanced security |
| **Plain Docker** | Low | ⚠️ To configure (external reverse proxy) | ✅ Container | Local testing, simple VPS | Single container, no embedded proxy |
| **Native binary** | Low | ⚠️ To configure (external Nginx/Caddy) | ❌ System process | Full control, limited resources, dev | No Docker dependency, lightweight binary (~5 MB), instant startup |

**Recommendation** : Docker Compose for production (HTTPS handled automatically). Native binary for local development or if you already master your reverse proxy.

---

## Prerequisites

| Prerequisite | Minimum version | Why |
|--------------|-----------------|-----|
| Docker | 24.0+ | Only for options 1 and 2 |
| Docker Compose | 2.20+ | Only for option 1 |
| Rust (binary option) | 1.99+ | Build from sources (option 3) |
| Domain name | — | HTTPS mandatory (Let's Encrypt requires a domain) |
| SSL certificate | Let's Encrypt (free) | TLS encryption, browser trust |
| Server / VPS | 512 MB RAM, 1 vCPU | The Rust server is lightweight (~10 MB RAM) |

**Compatible hosts** : Hetzner (Germany), OVH (France), Scaleway, Raspberry Pi 4+ (ARM64, 4 GB RAM recommended).

---

## Option 1 : Docker Compose (recommended)

### `docker-compose.yml`

```yaml
version: "3.8"

services:
  vroooom-server:
    image: vroooom/server:latest
    # or build: ./server (to compile from sources)
    container_name: vroooom-server
    restart: unless-stopped
    environment:
      - FEATURE_ACCOUNT_CREATION=false      # false in prod, true in dev
      - DATA_DIR=/data
      - PORT=8080
      - RUST_LOG=info
      - ALLOWED_ORIGINS=https://app.vroooom.example.com
    volumes:
      - ./data:/data                        # Persistence of encrypted blobs
    expose:
      - "8080"                              # Internal only (no ports:)
    networks:
      - vroooom-network
    user: "1000:1000"                       # Non-root
    read_only: true                         # Read-only filesystem
    tmpfs:
      - /tmp                                # Only /tmp is writable
    security_opt:
      - no-new-privileges:true

  nginx:
    image: nginx:alpine
    container_name: vroooom-nginx
    restart: unless-stopped
    ports:
      - "80:80"                             # HTTP (HTTPS redirect)
      - "443:443"                           # HTTPS
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certbot/conf:/etc/letsencrypt:ro   # Let's Encrypt certificates
      - ./certbot/www:/var/www/certbot:ro    # ACME challenge
    networks:
      - vroooom-network
    depends_on:
      - vroooom-server

  certbot:
    image: certbot/certbot:latest
    container_name: vroooom-certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

networks:
  vroooom-network:
    driver: bridge
```

### Building the server image

```dockerfile
# server/Dockerfile
# Build stage (Alpine + musl pour binaire statique)
FROM rust:1.99-alpine AS builder
WORKDIR /app
COPY . .
RUN cargo build --release

# Runtime stage (Alpine minimal)
FROM alpine:3.19
RUN apk add --no-cache ca-certificates
RUN adduser -D -u 1000 vroooom
COPY --from=builder /app/target/release/vroooom-server /usr/local/bin/
USER vroooom
EXPOSE 8080
CMD ["vroooom-server"]
```

```bash
# Build and start
docker compose build vroooom-server
docker compose up -d
```

---

## Option 2 : Plain Docker

For a minimal deployment without orchestration (local testing, VPS with reverse proxy already in place).

### `Dockerfile` (identical to option 1)

```dockerfile
# server/Dockerfile
# Build stage (Alpine + musl pour binaire statique)
FROM rust:1.99-alpine AS builder
WORKDIR /app
COPY . .
RUN cargo build --release

# Runtime stage (Alpine minimal)
FROM alpine:3.19
RUN apk add --no-cache ca-certificates
RUN adduser -D -u 1000 vroooom
COPY --from=builder /app/target/release/vroooom-server /usr/local/bin/
USER vroooom
EXPOSE 8080
CMD ["vroooom-server"]
```

### Commands

```bash
# Build the image
cd server
docker build -t vroooom-server:latest .

# Run (with volume for persistence)
docker run -d \
  --name vroooom-server \
  --restart unless-stopped \
  -p 8080:8080 \
  -v $(pwd)/data:/data \
  -e FEATURE_ACCOUNT_CREATION=false \
  -e DATA_DIR=/data \
  -e PORT=8080 \
  -e RUST_LOG=info \
  -e ALLOWED_ORIGINS=https://app.vroooom.example.com \
  --user 1000:1000 \
  vroooom-server:latest
```

**⚠️ Warning** : Port 8080 is exposed directly. Use a reverse proxy (Nginx, Caddy, Traefik) in front for HTTPS. Never expose 8080 on the Internet without TLS.

**Why this option** : Simpler than Compose, useful if you already have a reverse proxy (Caddy, Traefik) or for local use only.

---

## Option 3 : Native binary

Without Docker. Download the precompiled binary (GitHub Releases) or build from sources.

### Download (precompiled binary)

```bash
# Linux x86_64 (standard servers)
curl -LO https://github.com/kuroidoruido/vroooom/releases/latest/download/vroooom-server-linux-x86_64
chmod +x vroooom-server-linux-x86_64
sudo mv vroooom-server-linux-x86_64 /usr/local/bin/vroooom-server

# Linux ARM64 (Raspberry Pi 4/5)
curl -LO https://github.com/kuroidoruido/vroooom/releases/latest/download/vroooom-server-linux-arm64
chmod +x vroooom-server-linux-arm64
sudo mv vroooom-server-linux-arm64 /usr/local/bin/vroooom-server
```

### Build from sources

```bash
# Prerequisites: Rust 1.99+, git
sudo apt install build-essential pkg-config libssl-dev  # Debian/Ubuntu
# or: sudo dnf install gcc pkg-config openssl-devel       # Fedora

# Clone and build
git clone https://github.com/kuroidoruido/vroooom.git
cd vroooom/server
cargo build --release

# Install
sudo cp target/release/vroooom-server /usr/local/bin/
sudo chmod +x /usr/local/bin/vroooom-server
```

### Manual launch

```bash
# Create the data folder
sudo mkdir -p /var/lib/vroooom
sudo chown $USER:$USER /var/lib/vroooom

# Launch (foreground, for testing)
FEATURE_ACCOUNT_CREATION=false \
DATA_DIR=/var/lib/vroooom \
PORT=8080 \
RUST_LOG=info \
vroooom-server
```

### Systemd service (automatic launch)

```bash
# Create the dedicated user
sudo useradd -r -s /bin/false vroooom
sudo mkdir -p /var/lib/vroooom
sudo chown vroooom:vroooom /var/lib/vroooom

# Create the service
sudo tee /etc/systemd/system/vroooom.service << 'EOF'
[Unit]
Description=vroooom Server (Zero-Knowledge Vehicle Tracker)
After=network.target

[Service]
Type=simple
User=vroooom
Group=vroooom
Environment="FEATURE_ACCOUNT_CREATION=false"
Environment="DATA_DIR=/var/lib/vroooom"
Environment="PORT=8080"
Environment="RUST_LOG=info"
Environment="ALLOWED_ORIGINS=https://app.vroooom.example.com"
ExecStart=/usr/local/bin/vroooom-server
Restart=on-failure
RestartSec=5

# Security (sandboxing)
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
PrivateDevices=true
ReadWritePaths=/var/lib/vroooom

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable vroooom
sudo systemctl start vroooom

# Check
sudo systemctl status vroooom
journalctl -u vroooom -f
```

**Why this option** :
- No Docker dependency (useful on old systems, LXC containers, or if you hate Docker)
- Single static binary (~5 MB), no container overhead
- Full control over the process (systemd manages logs, restart, sandboxing)
- Ideal for Raspberry Pi (ARM64) or minimalist VPS

**⚠️ With this option**, you must manage yourself :
- HTTPS (Nginx/Caddy reverse proxy mandatory in front of port 8080)
- Updates (download the new binary, restart the service)
- Backup (see [Backup](#backup) section)

---

## Environment variables

| Variable | Description | Default | Required | Environment |
|----------|-------------|---------|----------|-------------|
| `FEATURE_ACCOUNT_CREATION` | Enables/disables creation of new accounts | `false` | ❌ | `false` in prod, `true` in dev |
| `DATA_DIR` | Data storage folder (encrypted blobs) | `/data` | ✅ | Always `/data` (mounted volume) |
| `PORT` | Rust server listen port | `8080` | ❌ | `8080` (internal, not exposed) |
| `RUST_LOG` | Log level (`error`, `warn`, `info`, `debug`, `trace`) | `info` | ❌ | `info` in prod, `debug` in dev |
| `ALLOWED_ORIGINS` | Allowed origins for CORS (comma-separated) | `*` | ❌ | `https://app.vroooom.example.com` in prod |

### Configuration example

```bash
# .env (do not commit !)
FEATURE_ACCOUNT_CREATION=false
DATA_DIR=/data
PORT=8080
RUST_LOG=info
ALLOWED_ORIGINS=https://app.vroooom.example.com,https://vroooom.example.com

# Domain for Let's Encrypt
DOMAIN=api.vroooom.example.com
EMAIL=admin@example.com
```

---

## HTTPS mandatory

### Why HTTPS is non-negotiable

| Risk without HTTPS | Consequence |
|--------------------|-------------|
| MITM (man-in-the-middle) | Interception of encrypted blobs (useless without the key, but...) |
| Downgrade attack | Force HTTP, expose metadata (salt, authHash, mtime) |
| Content injection | Modification of blobs in transit (detectable by hash chain, but...) |

Even if the blobs are encrypted, HTTPS is mandatory to protect metadata and channel integrity.

### Nginx configuration

The configuration below applies to **all 3 deployment options** :
- **Option 1 (Docker Compose)** : Nginx in a separate container (see docker-compose.yml)
- **Option 2 (Plain Docker)** : Nginx on the host, proxy to `localhost:8080`
- **Option 3 (Native binary)** : Nginx on the host, proxy to `127.0.0.1:8080`

```nginx
# nginx.conf
server {
    listen 80;
    server_name api.vroooom.example.com;

    # HTTP → HTTPS redirect
    location / {
        return 301 https://$host$request_uri;
    }

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}

server {
    listen 443 ssl http2;
    server_name api.vroooom.example.com;

    # Let's Encrypt certificates
    ssl_certificate /etc/letsencrypt/live/api.vroooom.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.vroooom.example.com/privkey.pem;

    # TLS 1.3 only
    ssl_protocols TLSv1.3;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    # Proxy to the Rust server
    location / {
        proxy_pass http://vroooom-server:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Rate limiting (login brute-force)
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://vroooom-server:8080;
        # ... (same headers)
    }
}

# Rate limiting zone (in http {})
limit_req_zone $binary_remote_addr zone=login:10m rate=10r/m;
```

### Obtaining the certificate (certbot)

```bash
# First issuance
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d api.vroooom.example.com \
  --email admin@example.com \
  --agree-tos \
  --no-eff-email

# Renewal (automatic via the certbot service in docker-compose)
docker compose run --rm certbot renew
```

---

## Backup

### Principle

The `/data` folder contains **everything** : salt, authHash, encrypted blobs. It is the only source of truth server-side.

### Why backup is trivial

| Aspect | With DB | With files (vroooom) |
|--------|---------|----------------------|
| Backup | `pg_dump`, `mysqldump` | `git add /data && git commit` or `rsync` |
| Restore | Recreate the DB, import the dump | `git clone` or copy the folder |
| Versioning | Dedicated tools (Flyway, etc.) | `git log`, `git diff` native |
| Size | SQL dump (can be large) | Real size of hex files |

### Method 1 : Git (recommended)

```bash
# Initialization (once)
cd /path/to/vroooom/data
sudo chown -R $USER:$USER .
git init
git add .
git commit -m "Initial backup"

# Regular backup (cron)
0 3 * * * cd /path/to/vroooom/data && git add -A && git commit -m "Backup $(date +\%Y-\%m-\%d)" && git push origin main
```

**Why git** : hex text storage = line-by-line readable diff. Complete history. Possibility to restore to any date.

### Method 2 : Rsync to another server

```bash
# Backup to a remote server
rsync -avz --delete /path/to/vroooom/data/ user@backup-server:/backups/vroooom/

# Restore
rsync -avz user@backup-server:/backups/vroooom/ /path/to/vroooom/data/
```

### Method 3 : VPS snapshot

Most hosts (Hetzner, OVH) offer automatic disk snapshots. Complementary to the git backup.

### Recommended frequency

| Method | Frequency | Retention |
|--------|-----------|-----------|
| Git (local) | Daily (cron) | 30 days |
| Rsync (remote) | Weekly | 12 weeks |
| VPS snapshot | Weekly | 4 snapshots |

---

## Server security

### Firewall (ufw)

```bash
# Installation and configuration
sudo apt install ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH (or custom port)
sudo ufw allow 80/tcp    # HTTP (HTTPS redirect)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

**Why** : port 8080 (Rust server) must **never** be exposed directly. Only 80 and 443 are open, the Nginx proxy does the relay.

### Automatic updates

```bash
# Debian/Ubuntu
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Non-root user in the container

```dockerfile
# In the Dockerfile
RUN useradd -u 1000 -m vroooom
USER vroooom
```

And in `docker-compose.yml` :

```yaml
services:
  vroooom-server:
    user: "1000:1000"
    read_only: true
    security_opt:
      - no-new-privileges:true
```

### Security checklist

| Measure | Status |
|---------|--------|
| HTTPS mandatory (TLS 1.3) | ✅ Configured (Nginx) |
| Port 8080 not exposed | ✅ `expose:` only, no `ports:` |
| Non-root user | ✅ `user: "1000:1000"` |
| Read-only filesystem | ✅ `read_only: true` + `tmpfs /tmp` |
| Firewall (ufw) | ⚠️ To configure |
| Auto updates | ⚠️ To configure |
| Rate limiting | ✅ Nginx `limit_req` |
| `FEATURE_ACCOUNT_CREATION=false` in prod | ✅ Environment variable |
| Regular backup | ⚠️ To automate (cron) |

---

## Self-hosting

### Quick VPS guide (Hetzner / OVH)

#### Method A : Docker Compose (recommended)

```bash
# 1. Connect to the server
ssh root@your-server-ip

# 2. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 3. Clone the project
mkdir -p ~/vroooom && cd ~/vroooom
git clone https://github.com/kuroidoruido/vroooom.git deploy
cd deploy

# 4. Configure
cp .env.example .env
nano .env  # Edit DOMAIN, EMAIL, ALLOWED_ORIGINS

# 5. Obtain the SSL certificate
docker compose run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  -d $DOMAIN --email $EMAIL --agree-tos --no-eff-email

# 6. Start
docker compose up -d

# 7. Check
curl https://$DOMAIN/api/health
```

#### Method B : Native binary (without Docker)

```bash
# 1. Connect
ssh root@your-server-ip

# 2. Install dependencies
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx

# 3. Download the binary
curl -LO https://github.com/kuroidoruido/vroooom/releases/latest/download/vroooom-server-linux-x86_64
sudo mv vroooom-server-linux-x86_64 /usr/local/bin/vroooom-server
sudo chmod +x /usr/local/bin/vroooom-server

# 4. Create the user and data folder
sudo useradd -r -s /bin/false vroooom
sudo mkdir -p /var/lib/vroooom
sudo chown vroooom:vroooom /var/lib/vroooom

# 5. Create the systemd service (see Option 3 above)
# ... copy the systemd block ...

# 6. Configure Nginx (reverse proxy)
sudo tee /etc/nginx/sites-available/vroooom << 'EOF'
server {
    listen 80;
    server_name api.vroooom.example.com;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl http2;
    server_name api.vroooom.example.com;

    ssl_certificate /etc/letsencrypt/live/api.vroooom.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.vroooom.example.com/privkey.pem;
    ssl_protocols TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
sudo ln -s /etc/nginx/sites-available/vroooom /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 7. Obtain the SSL certificate
sudo certbot --nginx -d api.vroooom.example.com --email admin@example.com --agree-tos

# 8. Start the service
sudo systemctl enable vroooom
sudo systemctl start vroooom

# 9. Check
curl https://api.vroooom.example.com/api/health
```

### Raspberry Pi 4+ (ARM64)

```bash
# Option Docker (recommended)
docker compose build vroooom-server  # Build on the Pi (slow, ~5 min) or cross-compile

# Option Binary (recommended on Pi)
# Download the ARM64 version directly (no compilation needed)
curl -LO https://github.com/kuroidoruido/vroooom/releases/latest/download/vroooom-server-linux-arm64
sudo mv vroooom-server-linux-arm64 /usr/local/bin/vroooom-server
# Then follow method B above
```

**Pi prerequisites** : Raspberry Pi 4 (4 GB RAM recommended), fast SD card (or USB SSD), stable power supply.

---

## Related documents

- [MAIN.md](MAIN.md) — Overview
- [ARCHI.md](ARCHI.md) — Technical architecture (deployment diagram)
- [SECURITY.md](SECURITY.md) — Security configuration, HTTPS, threat model
- [API.md](API.md) — API endpoints (CORS, authentication)
- [DATA.md](DATA.md) — Server storage (`/data` directory structure)
- [BUSINESS.md](BUSINESS.md) — Business rules
- [ROADMAP.md](ROADMAP.md) — Roadmap

---

*Last updated : 2026-10-09*
