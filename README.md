
# 🚀 Devovia Monorepo

This is the monorepo for the **Devovia** platform, a developer community and portfolio showcase built with modern technologies including:

- ⚡️ **PNPM Workspaces** for efficient package management
- 🧱 **Modular Architecture** using `apps/` and `packages/`
- 🔄 **Automated Prisma Schema Sync** for consistent database schemas
- ☁️ **Railway + Vercel** for seamless deployment and infrastructure
- 🔐 **GitHub OAuth** integration for social authentication
- 📦 **Shared database package** for full-stack type safety

---

## 📁 Project Structure
```

.
├── apps/ # Frontend and backend apps
│ ├── api/ # Express/Nest.js/Next.js backend service
│ └── web/ # Frontend app (if applicable)
├── packages/ # Reusable modules
│ ├── database/ # Prisma + DB logic
│ ├── utils/ # Shared helper functions
│ └── types/ # Shared TypeScript types
├── .github/ # GitHub Actions workflows
├── railway.json # Railway project settings
├── package.json # Workspace root
└── README.md

````

---

## 🛠️ Getting Started

### 1. Clone and install dependencies

```bash
git clone https://github.com/your-org/devovia.git
cd devovia
pnpm install
````

### 2. Set up environment

Copy `.env.example` files in relevant apps/packages and update values:

```bash
cp apps/api/.env.example apps/api/.env
```

### 3. Start development

```bash
pnpm dev       # Usually aliases apps/api or apps/web
pnpm dev:api   # Run backend only
pnpm dev:web   # Run frontend only (if present)
```

---

## 🚀 Deployment

We use a dual deployment strategy:

### Backend (Railway)

The API is deployed to [Railway](https://railway.app/) with a dedicated healthcheck server:

```bash
# Deploy API to Railway
cd apps/api
railway up
```

### Frontend (Vercel)

The web frontend is deployed to [Vercel](https://vercel.com/):

```bash
# Deploy web to Vercel
cd apps/web
vercel deploy --prod
```

### Monorepo Strategy

Our deployment is configured to work with the monorepo structure:

1. API has its own copy of the Prisma schema for independent deployment
2. Shared packages are properly referenced in each app
3. Environment variables are configured in each deployment platform

---

## 🧪 Running Tests

```bash
pnpm test     # Runs all tests across the workspace
```

Each package or app can have its own tests.

---

## 🔄 Prisma Schema Synchronization

This project uses an automated system to keep Prisma schemas in sync between the shared database package and the API package:

```bash
pnpm run sync-prisma  # Manually sync schemas if needed
```

### How It Works

1. The shared database package (`packages/database/prisma/schema.prisma`) is the single source of truth
2. Git hooks automatically sync the schema to the API package before commits and pushes
3. Migrations are created in the shared package and copied to the API package

This ensures consistent database schemas across all environments while allowing independent deployment of the API.

---

## 📚 Tech Stack

- **Monorepo Management**: PNPM Workspaces with Turbo
- **Backend**: Express.js with TypeScript
- **Frontend**: Next.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Session-based with GitHub OAuth integration
- **Authorization**: Role-based access control (USER, ADMIN, MODERATOR)
- **Deployment**: Railway (API) and Vercel (Web)
- **Schema Sync**: Custom Git hooks and automation scripts

---

> Built with ❤️ by the Devovia
