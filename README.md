# AISafe - AI Governance Platform for India

<p align="center">
  <img src="client/public/aisafe-logo.svg" alt="AISafe Logo" width="200"/>
</p>

<p align="center">
  <strong>Responsible AI Governance for the Indian Market</strong>
</p>

<p align="center">
  <a href="#deploy-on-railway-free-tier">
    <img src="https://railway.app/button.svg" alt="Deploy on Railway" />
  </a>
</p>

---

## Overview

**AISafe** is an open-source AI governance SaaS platform designed to help Indian businesses deploy and manage AI systems safely, responsibly, and in compliance with India's evolving regulatory landscape.

Built with inspiration from global AI governance best practices and tailored specifically for Indian regulations, AISafe provides comprehensive tools for AI risk management, compliance tracking, vendor assessment, and incident management.

## Key Features

### Core Governance
- **Compliance Management** — Track compliance with DPDP Act 2023, NITI Aayog AI Principles, MeitY Guidelines, BIS AI Standards, and 10+ Indian regulatory frameworks
- **AI Model Registry** — Centralized inventory of all AI/ML models with risk classification
- **Risk Assessment** — Comprehensive risk assessment with auto-scoring
- **Vendor Management** — Evaluate and monitor third-party AI vendors with DPDP compliance tracking
- **Incident Management** — Track and respond to AI-related incidents per CERT-In 6-hour reporting requirements
- **Data Processing Register** — DPDP Act ROPA compliance with legal basis tracking

### SaaS Features
- **AI Governance Advisor** — Chatbot with deep knowledge of all 10 Indian regulatory frameworks
- **AI Trust Center** — Public-facing transparency portal (MeitY & DPDP compliance)
- **Assessment Engine** — Template-based assessments: Model Risk, DPDP Readiness, Vendor Due Diligence
- **Policy Templates** — 6 pre-built India-specific governance policy templates
- **Notification System** — In-app + email notifications with CERT-In deadline alerts
- **Webhook Engine** — HMAC-SHA256 signed webhooks with delivery tracking
- **Global Search** — Search across models, risks, incidents, vendors, policies
- **File Uploads** — Tenant-isolated evidence attachments
- **Reports** — Comprehensive compliance reports with auto-generated recommendations
- **Subscription Billing** — 4 plan tiers in INR with GST
- **Audit Trail** — Complete activity history and event logging
- **Comments** — Threaded comments on any entity

## Indian Regulatory Frameworks Supported

| Framework | Requirements |
|-----------|-------------|
| Digital Personal Data Protection Act (DPDP) 2023 | 10 |
| NITI Aayog Responsible AI Principles | 7 |
| MeitY AI Advisory Guidelines 2024 | 6 |
| BIS AI Standards (IS/ISO 42001) | 7 |
| CERT-In Incident Reporting Requirements | 5 |
| RBI AI/ML Guidelines for Financial Services | 6 |
| SEBI AI Disclosure Framework | 4 |
| IRDAI AI Guidelines for Insurance | 4 |
| IndiaAI Mission Compliance | 5 |
| IT Act 2000 (Sections relevant to AI) | 4 |
| **Total** | **63 requirements** |

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 18 + Vite + Material UI |
| Backend | Node.js + Express.js |
| Database | PostgreSQL 15 |
| Cache | Redis |
| Auth | JWT + bcrypt |
| Deployment | **Railway (Free Tier)** |

## Deploy on Railway (Free Tier)

Railway gives you **$5 free credit/month** on the Trial plan — enough to run the full platform.

### One-Click Deploy

1. Go to [railway.app](https://railway.app) → New Project → Empty Project

2. **Add PostgreSQL**: + New → Database → PostgreSQL

3. **Add Redis**: + New → Database → Redis

4. **Deploy Server**:
   - \+ New → GitHub Repo → Select this repo
   - Root Directory: `server`
   - Start Command: `node src/start.js`
   - Add env vars:

   | Variable | Value |
   |----------|-------|
   | `JWT_SECRET` | Run `openssl rand -hex 32` |
   | `NODE_ENV` | `production` |
   | `CORS_ORIGIN` | *(set after client deploys)* |

   - Link `DATABASE_URL` from PostgreSQL and `REDIS_URL` from Redis

5. **Deploy Client**:
   - \+ New → GitHub Repo → Select this repo again
   - Root Directory: `client`
   - Build Command: `npm install && npm run build`
   - Start Command: `npx serve dist -s -l $PORT`
   - Add env var:

   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | `https://YOUR-SERVER.up.railway.app/api` |

6. **Update CORS**: Go back to Server → set `CORS_ORIGIN` to your Client URL

7. **Open your Client URL** → Register → Done!

> Full deployment guide: [docs/RAILWAY_DEPLOY.md](docs/RAILWAY_DEPLOY.md)

### Local Development

```bash
# Clone
git clone https://github.com/yellowstar-hue/ai-governance.git
cd ai-governance

# Server
cd server && cp .env.example .env
npm install && npm run migrate && npm run seed:all && npm run dev

# Client (new terminal)
cd client && npm install && npm run dev
```

Requires local PostgreSQL and Redis (or use Railway's free PostgreSQL/Redis and connect remotely).

## Project Structure

```
aisafe/
├── client/                  # React 18 frontend (18 pages)
│   ├── src/
│   │   ├── components/      # Layout, navigation, search, notifications
│   │   ├── pages/           # All 18 page components
│   │   ├── context/         # Auth context provider
│   │   └── services/        # API service layer (26 endpoints)
│   ├── public/              # Logo, static assets
│   └── railway.json         # Railway deploy config
├── server/                  # Express.js backend (26 API routes)
│   ├── src/
│   │   ├── routes/          # 26 route modules
│   │   ├── services/        # Email, notifications, webhooks, AI advisor,
│   │   │                    #   file upload, report generator, audit
│   │   ├── middleware/       # Auth, validation, tenant isolation
│   │   ├── config/          # Database, Redis config
│   │   ├── seeds/           # Frameworks, templates seed data
│   │   └── start.js         # Railway auto-migrate startup
│   ├── migrations/          # PostgreSQL schema (24 tables)
│   └── railway.json         # Railway deploy config
└── docs/
    └── RAILWAY_DEPLOY.md    # Full Railway deployment guide
```

## Platform Stats

| Metric | Count |
|--------|-------|
| API Routes | 26 |
| Frontend Pages | 18 |
| Database Tables | 24 |
| Regulatory Frameworks | 10 |
| Compliance Requirements | 63 |
| Policy Templates | 6 |
| Assessment Templates | 3 (29 questions) |
| Email Templates | 8 |
| Subscription Plans | 4 |

## Contributing

We welcome contributions! Please open an issue or submit a pull request.

## License

This project is licensed under the BSL 1.1 License. See [LICENSE](LICENSE) for details.

## Acknowledgements

- Inspired by the [VerifyWise](https://github.com/verifywise-ai/verifywise) AI governance platform
- Built for India's growing AI ecosystem under the IndiaAI Mission

---

<p align="center">Made with purpose for Responsible AI in India</p>
