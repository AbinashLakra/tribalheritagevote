# Tribal Heritage Vote (Adivasi Artists Showcase & Online Voting Platform)

> A modern, secure, and culturally respectful national web application celebrating Adivasi artists, dancers, singers, and craftsmen from across India. Based in Rourkela, Sundargarh district, Odisha.

---

## 🌟 Key Features

- **Public Showcase & Live Voting**: High-definition video showcase with categories across tribal dance (Santhali, Karma, Chhau), folk vocals, Sohrai/Khovar painting, and indigenous handicrafts.
- **Strict One-Vote-Per-Citizen Rule**: Enforced at the PostgreSQL database level using `UNIQUE (contest_id, voter_id)` and atomic RPC functions with rate limiting and salted IP/UA hashing.
- **Phone OTP Verification**: Built with Supabase Auth supporting standard Indian mobile numbers (+91) with encrypted phone hashing for citizen privacy.
- **Direct-to-R2 Video Storage**: Server-controlled presigned URLs streaming media directly to Cloudflare R2 up to 100MB, bypassing serverless payload limits.
- **Contest Lifecycle Management**: Administrator control panel supporting states (`draft`, `scheduled`, `open`, `paused`, `closed`, `finalized`) with auditable reopening policies.
- **Jury Moderation Queue**: Dedicated video moderation interface for the cultural evaluation committee with approval, rejection, and correction workflows.
- **Transparent Public Leaderboard**: Real-time ranking with category filters and visibility controls (`live`, `hidden`, `delayed`).
- **Certified Results**: Immutable cryptographic result snapshots with SHA-256 validation.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js `v20+` or `v24+`
- npm `v10+` or `v11+`

### 2. Installation
```bash
# Clone the repository and navigate to the directory
cd d:\tribalheritagevote

# Copy environment variables
cp .env.example .env.local

# Install dependencies (already installed if using this repo)
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Run Test Suite
```bash
# Run unit and integration tests with Vitest
npm test

# Run TypeScript type check
npx tsc --noEmit
```

---

## 📂 Documentation

- [System Architecture](docs/architecture.md)
- [Database Schema & Migrations](docs/database-schema.md)
- [Voting Flow & One-Vote Rule](docs/voting-flow.md)
- [Security & Row Level Security (RLS)](docs/security.md)
- [Production Deployment Guide](docs/deployment.md)
- [Environment Variables Guide](docs/environment-variables.md)

---

## 🏛️ Cultural Foundation
Conceived in Rourkela, Odisha, to honor the ancestral heritage of Santhal, Ho, Munda, Oraon, Gond, Bhil, Saora, and indigenous communities across India.
