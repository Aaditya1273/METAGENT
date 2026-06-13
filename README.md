# TaxFi — Your Crypto Tax Agent That Pays for Itself

[![CI](https://github.com/your-org/taxfi/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/taxfi/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

TaxFi is a non-custodial, agentic crypto tax platform. Your multi-agent pipeline scans every wallet across Ethereum, Base, and Arbitrum, classifies every transaction with Venice AI, finds the optimal cost basis method (HIFO), identifies tax loss harvesting opportunities, and generates IRS-ready forms.

**Key differentiators:**
- **Non-custodial** — read-only ERC-7715 permissions, you never give up wallet control
- **Agentic** — runs continuously, not just at year-end
- **Gasless** — 1Shot relayer pays gas in USDC
- **Pay only on savings** — 5% of what we save you, not a subscription
- **Privacy-first** — Venice AI TEE inference, prompts never stored

---

## Architecture

```
                    User's Wallets (read-only via ERC-7715)
                              │
                              ▼
┌─────────────────────────────────────────────────────┐
│          Ingest Agent (Covalent / Alchemy)           │
│  • Pulls all transactions across all chains          │
│  • Normalizes into canonical format                  │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│          Classifier Agent (Venice AI)                │
│  • Categorizes every event                           │
│  • Handles DeFi edge cases                           │
│  • Confidence scoring                                │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│      Basis Agent + Loss Detector (Venice AI)         │
│  • FIFO / LIFO / HIFO / SpecID                       │
│  • Continuous loss harvesting detection              │
└─────────────────────┬───────────────────────────────┘
                      │
              ┌───────┴────────┐
              ▼                ▼
   ┌──────────────────┐  ┌──────────────────┐
   │  Form Generator  │  │ Loss Harvester   │
   │  Agent (Venice)  │  │ Executor (1Shot) │
   └──────────────────┘  └──────────────────┘
              │                │
              ▼                ▼
   ┌──────────────────┐  ┌──────────────────┐
   │  IRS Form 8949   │  │  USDC received   │
   │  + Schedule D    │  │  in user wallet  │
   └──────────────────┘  └──────────────────┘
```

---

## Prerequisites

- **Python 3.11+** (backend)
- **Node.js 20+** and **pnpm** (frontend)
- **Docker + Docker Compose v2** (production deployment)
- **API keys:**
  - [Venice AI](https://venice.ai) — transaction classification & optimization
  - [Covalent](https://www.covalenthq.com/) or [Alchemy](https://www.alchemy.com/) — onchain data
  - [WalletConnect Project ID](https://cloud.walletconnect.com/) *(optional: fallback to injected MetaMask)*
  - [1Shot API Key](https://1shot.com) *(for gasless execution)*

---

## Quick Start (Development)

### Backend

```bash
# Create virtual environment
python3 -m venv .venv && source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Set environment variables
export VENICE_API_KEY="your-venice-key"
export COVALENT_API_KEY="your-covalent-key"

# Run the API server (with hot reload)
python -m backend.api

# Or just the orchestration agent
python -m backend.taxfi
```

### Frontend

```bash
cd frontend
pnpm install

# Set WalletConnect Project ID (optional — fallback to injected MetaMask)
export NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID="your-project-id"

# Start dev server (default: http://localhost:3000)
pnpm dev
```

### Smart Contracts (optional — for local testing)

```bash
cd contracts
npm install
npx hardhat test
npx hardhat compile
```

### Test

```bash
# Run full test suite
cd /path/to/taxfi
PYTHONPATH=. TAXFI_FORM_DEV_MODE=true python3 -m pytest tests/ -q

# Run specific test
PYTHONPATH=. TAXFI_FORM_DEV_MODE=true python3 -m pytest tests/test_api.py::test_health -v
```

---

## Production Deployment

### 1. Configure .env

```bash
cp .env.example .env
```

Edit `.env` with your domain and API keys:

| Variable | Required | Description |
|---|---|---|
| `DOMAIN` | ✅ | Your production domain (e.g., `taxfi.example.com`) |
| `TRAEFIK_ACM_EMAIL` | ✅ | Email for Let's Encrypt certificate notices |
| `VENICE_API_KEY` | ✅ | Venice AI API key for classification |
| `COVALENT_API_KEY` | ⚠️ | Covalent API key (or use Alchemy) |
| `ALCHEMY_API_KEY` | ⚠️ | Alchemy API key (or use Covalent) |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | ⚠️ | Needed for full WalletConnect support |
| `TAXFI_JWT_SECRET` | ✅ | **Must be a strong random secret** — used to sign auth tokens. Set `TAXFI_AUTH_DISABLED=true` to skip JWT auth for local dev |
| `TAXFI_DB_TYPE` | Optional | `sqlite` (default) or `postgres` |
| `TAXFI_PG_PASSWORD` | Optional | PostgreSQL password (required if using postgres profile) |

> **Security**: If `TAXFI_JWT_SECRET` is not set and `TAXFI_AUTH_DISABLED` is not `true`, the server will refuse to start. This prevents accidentally deploying with the dev fallback secret.

### 2. Create ACME file

```bash
bash deployment/setup.sh
```

This creates `acme.json` with correct permissions (required by Traefik for Let's Encrypt).

### 3. Start the stack

```bash
# Standard deployment (SQLite)
docker compose up --build -d

# With PostgreSQL
docker compose --profile postgres up --build -d

# With database backups (runs daily at 3am)
docker compose --profile backup up --build -d
```

Your app will be available at `https://${DOMAIN}` with automatic TLS.

### 4. Monitoring

- **Health check**: `https://${DOMAIN}/api/health`
- **API docs**: `https://${DOMAIN}/docs`
- **Prometheus metrics**: `https://${DOMAIN}/api/metrics`
- **Traefik logs**: `docker compose logs traefik`

### 5. Database Backups

When using the `backup` profile, SQLite snapshots are created daily at 3am:

```bash
# Backups are stored in the taxfi-data Docker volume
# Retention: 7 days (configurable via TAXFI_BACKUP_RETENTION_DAYS)
# Optional S3 off-site upload via TAXFI_BACKUP_S3_URL
```

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health + circuit breaker status |
| `GET` | `/metrics` | Prometheus metrics |
| `POST` | `/users` | Register a new user wallet |
| `GET` | `/users/{address}` | Get user details |
| `POST` | `/pipeline/run` | Run the multi-agent pipeline |
| `GET` | `/pipeline/status` | Pipeline running status |
| `GET` | `/opportunities` | List all harvest opportunities |
| `POST` | `/opportunities/{index}/execute` | Execute a harvest |
| `POST` | `/forms` | Generate IRS forms (Form 8949, Schedule D) |
| `GET` | `/ledgers` | Cost basis ledgers |
| `GET` | `/lots` | Open tax lots |

---

## Development

### Project Structure

```
backend/               # FastAPI backend (multi-agent pipeline)
  api.py              # REST + WebSocket API server
  taxfi.py            # Orchestrator agent
  config.py           # Configuration management
  database*.py         # Database layer (SQLite + PostgreSQL)
  auth_middleware.py   # JWT + API key authentication
  agents/             # Specialized agents
    form_generator.py
    ...
  integrations/       # External API integrations
    venice.py         # Venice AI classification
    x402.py           # x402 payment verification
    oneshot.py        # 1Shot relayer integration
  utils/              # Helpers (monitoring, retry, etc.)
frontend/              # Next.js 15 app
  src/
    app/              # Pages (dashboard, portfolio, harvest, etc.)
    components/       # UI components
    hooks/            # React hooks (useTaxFi, useMetaMaskPermissions)
    utils/            # API client, permission utilities
contracts/            # Solidity smart contracts (Hardhat)
deployment/           # Production deployment configs
  traefik.yml         # Traefik v3 static config
  nginx.conf          # nginx for dev/fallback
  setup.sh            # ACME setup script
  backup.sh           # Database backup script
tests/                # Backend tests (pytest)
.github/workflows/    # CI/CD pipeline
```

### CI/CD Pipeline

The project uses GitHub Actions (`.github/workflows/ci.yml`):

- **Lint**: Ruff (Python) + ESLint (TypeScript)
- **Test**: 177 pytest suite runs in ~20s
- **Build**: Frontend Next.js build + smart contract compilation
- **Docker**: Container builds (not yet pushed)

### Production Hardening Checklist

- [x] JWT secret enforcement (no fallback in production)
- [x] x402 payment verification (onchain + facilitator)
- [x] Form generator dev mode gating (`TAXFI_FORM_DEV_MODE`)
- [x] Traefik security headers (CSP, HSTS 1yr, frameDeny, nosniff)
- [x] Rate limiting (100 req/min per IP via slowapi + Traefik)
- [x] Exponential backoff retry in API client (3 retries, 5xx & network errors)
- [x] WebSocket same-origin in production + leak fix
- [x] Toast notification system (replaces `alert()`)
- [x] Mobile-responsive sidebar with hamburger toggle
- [x] Traefik direct routing: `/api` → backend, `/ws` → backend
- [x] Next.js standalone output (Docker)
- [x] Database schema migrations (startup)
- [x] Automated database backups (daily + S3)
- [x] Health checks + Prometheus metrics
- [x] Circuit breakers per external service
- [ ] Load testing & rate limit tuning
- [ ] Grafana dashboard for metrics
- [ ] Frontend component tests

---
freebuff --continue 2026-06-09T04-25-48.092Zs

## Security

- **Non-custodial**: ERC-7715 read-only permissions. User never gives up wallet control.
- **JWT auth**: Token-based auth with 24h expiry. Production requires explicit `TAXFI_JWT_SECRET`.
- **Rate limited**: 100 requests/minute per IP via slowapi backend + Traefik edge proxy.
- **Headers**: CSP, HSTS (1 year, preload), frameDeny, nosniff, XSS filter, referrer policy.
- **TLS**: Automatic Let's Encrypt certificates via Traefik.
- **Payments**: x402 verification checks facilitator + onchain receipts (no blind trust).

---

## License

MIT — see [LICENSE](LICENSE.md)

---

## Team

Built for the MetaMask Smart Accounts Kit × 1Shot API × Venice AI Dev Cook Off.

Contact: team@taxfi.xyz
