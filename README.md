# AISafe - AI Governance Platform for India

<p align="center">
  <img src="client/public/aisafe-logo.svg" alt="AISafe Logo" width="200"/>
</p>

<p align="center">
  <strong>Responsible AI Governance for the Indian Market</strong>
</p>

---

## Overview

**AISafe** is an open-source AI governance platform designed to help Indian businesses deploy and manage AI systems safely, responsibly, and in compliance with India's evolving regulatory landscape.

Built with inspiration from global AI governance best practices and tailored specifically for Indian regulations, AISafe provides comprehensive tools for AI risk management, compliance tracking, vendor assessment, and incident management.

## Key Features

- **Compliance Management** — Track compliance with DPDP Act 2023, NITI Aayog AI Principles, MeitY Guidelines, BIS AI Standards, and 10+ Indian regulatory frameworks
- **AI Model Registry** — Centralized inventory of all AI/ML models with risk classification per India's proposed AI risk categories
- **Risk Assessment** — Comprehensive risk assessment aligned with Indian regulatory expectations
- **Vendor Management** — Evaluate and monitor third-party AI vendors and service providers
- **Incident Management** — Track and respond to AI-related incidents per CERT-In reporting requirements
- **Policy Manager** — Templates aligned with Indian data protection and AI governance requirements
- **Evidence Center** — Organized evidence repository for audit readiness
- **Reports & Analytics** — Generate compliance reports, risk dashboards, and audit-ready documentation
- **AI Trust Center** — Public-facing transparency portal for AI system disclosures
- **Audit Trail** — Complete activity history and event logging

## Indian Regulatory Frameworks Supported

| Framework | Status |
|-----------|--------|
| Digital Personal Data Protection Act (DPDP) 2023 | Supported |
| NITI Aayog Responsible AI Principles | Supported |
| MeitY AI Advisory Guidelines 2024 | Supported |
| BIS AI Standards (IS/ISO 42001) | Supported |
| CERT-In Incident Reporting Requirements | Supported |
| RBI AI/ML Guidelines for Financial Services | Supported |
| SEBI AI Disclosure Framework | Supported |
| IRDAI AI Guidelines for Insurance | Supported |
| IndiaAI Mission Compliance | Supported |
| IT Act 2000 (Sections relevant to AI) | Supported |

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express.js |
| Database | PostgreSQL 15 |
| Cache | Redis |
| Auth | JWT + bcrypt |
| Deployment | Docker + Docker Compose |

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- npm or yarn

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yellowstar-hue/ai-governance.git
cd ai-governance

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install

# Set up environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env

# Run database migrations
cd ../server && npm run migrate

# Seed initial data (Indian regulatory frameworks)
npm run seed

# Start development servers
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

### Docker Setup

```bash
docker-compose up -d
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api-docs

## Project Structure

```
aisafe/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page-level components
│   │   ├── context/         # React context providers
│   │   ├── services/        # API service layer
│   │   └── utils/           # Utility functions
│   └── public/              # Static assets
├── server/                  # Express.js backend
│   ├── src/
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/       # Express middleware
│   │   ├── services/        # Business logic
│   │   ├── config/          # Configuration
│   │   └── seeds/           # Database seed data
│   └── migrations/          # Database migrations
├── docs/                    # Documentation
├── scripts/                 # Utility scripts
└── docker-compose.yml       # Docker configuration
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the BSL 1.1 License. See [LICENSE](LICENSE) for details.

## Acknowledgements

- Inspired by the [VerifyWise](https://github.com/verifywise-ai/verifywise) AI governance platform
- Built for India's growing AI ecosystem under the IndiaAI Mission

---

<p align="center">Made with purpose for Responsible AI in India</p>
