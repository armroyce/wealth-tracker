# WealthTracker — Personal Wealth Management App

A full-stack personal finance tracker to monitor net worth, investments, income, expenses, debts, and financial goals.

## Tech Stack
- **Frontend**: React.js + Tailwind CSS + Recharts
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT + bcrypt
- **Hosting**: Vercel (frontend) + Railway (backend + DB)

---

## Quick Start (Local Development)

### Option A: Docker Compose (easiest)
```bash
# From project root
docker-compose up --build
```
App runs at http://localhost:3000, API at http://localhost:5000

---

### Option B: Manual Setup

#### 1. Database (PostgreSQL)
```bash
# Install PostgreSQL locally or use Docker:
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=wealth_tracker postgres:16-alpine
```

#### 2. Backend Setup
```bash
cd server
npm install

# Copy and configure env
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed demo data (optional)
npm run db:seed

# Start server
npm run dev
```
Server runs on http://localhost:5000

#### 3. Frontend Setup
```bash
cd client
npm install

# Copy and configure env
cp .env.example .env
# Edit .env — set REACT_APP_API_URL=http://localhost:5000/api

# Start frontend
npm start
```
App runs on http://localhost:3000

---

## Demo Account
After seeding: `demo@wealthtracker.com` / `demo1234`

---

## Environment Variables

### Server (`server/.env`)
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for access tokens (change in prod!) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (change in prod!) |
| `JWT_EXPIRES_IN` | Access token expiry (default: `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry (default: `7d`) |
| `ALPHA_VANTAGE_API_KEY` | Free API key from alphavantage.co for live prices |
| `PORT` | Server port (default: `5000`) |
| `CLIENT_URL` | Frontend URL for CORS |

### Client (`client/.env`)
| Variable | Description |
|---|---|
| `REACT_APP_API_URL` | Backend API URL |

---

## Deployment

### Backend → Railway
1. Create Railway account at railway.app
2. New Project → Deploy from GitHub → select `/server`
3. Add PostgreSQL service to project
4. Set environment variables in Railway dashboard
5. Railway auto-detects Node.js and runs `npm start`
6. After first deploy, run migrations: `npx prisma migrate deploy`

### Frontend → Vercel
1. Create Vercel account at vercel.com
2. Import project → select `/client` folder
3. Framework preset: Create React App
4. Add environment variable: `REACT_APP_API_URL` = your Railway backend URL
5. Deploy

---

## Features
- **Dashboard** — Net worth, income/expense charts, recent transactions, goal progress
- **Accounts** — Track bank, brokerage, crypto, real estate, retirement accounts
- **Transactions** — Full CRUD with CSV import/export, search, pagination, filters
- **Investments** — Portfolio tracking with live price refresh via Alpha Vantage
- **Budget** — Monthly budgets per category with visual progress bars and alerts
- **Debts** — Debt tracker with snowball/avalanche payoff calculator
- **Goals** — Savings goals with deadline tracking and contribution history
- **Net Worth** — Timeline history with snapshot system
- **Reports** — Monthly/annual income, expense, and category breakdowns

---

## API Reference

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me
PATCH  /api/auth/profile

GET    /api/accounts
POST   /api/accounts
PATCH  /api/accounts/:id
DELETE /api/accounts/:id

GET    /api/transactions         ?page&limit&type&category&search&startDate&endDate
POST   /api/transactions
PATCH  /api/transactions/:id
DELETE /api/transactions/:id
GET    /api/transactions/export
POST   /api/transactions/import

GET    /api/investments
GET    /api/investments/allocation
POST   /api/investments
POST   /api/investments/refresh-prices
PATCH  /api/investments/:id
DELETE /api/investments/:id

GET    /api/budgets              ?month&year
POST   /api/budgets
PATCH  /api/budgets/:id
DELETE /api/budgets/:id

GET    /api/debts
GET    /api/debts/payoff-plan    ?method=avalanche|snowball&extraPayment
POST   /api/debts
PATCH  /api/debts/:id
DELETE /api/debts/:id

GET    /api/goals
POST   /api/goals
POST   /api/goals/:id/contribute
PATCH  /api/goals/:id
DELETE /api/goals/:id

GET    /api/networth
GET    /api/networth/history     ?months
POST   /api/networth/snapshot

GET    /api/reports/dashboard
GET    /api/reports/monthly      ?month&year
GET    /api/reports/annual       ?year
```
