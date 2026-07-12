# TransitOps Workspace

This directory contains the TransitOps local development workspace.

> **Note**: This step prepares the workspace only.
> Product features will be implemented in later steps.
> No vehicle/driver/trip/maintenance modules are built yet.
> The environment is ready for continuous development.

## Tech Stack

- **Framework**: Next.js App Router
- **Language**: TypeScript
- **Database**: SQLite (via Prisma)
- **UI**: Tailwind CSS + shadcn/ui
- **Testing**: Vitest + Playwright
- **Docker**: For local execution and predictable environments

## Prerequisites

- **Docker** and **Docker Compose** installed locally.
- (You do _not_ need Node.js installed globally, as everything runs in Docker).

## Quick Start

To start the environment, run:

```bash
make dev
```

(Or run `docker compose up --build -d`).

Once started, the following services will be available:

- **App**: [http://localhost:3000](http://localhost:3000)
- **Prisma Studio**: [http://localhost:5555](http://localhost:5555)

## Available Commands

Use the Makefile shortcuts:

- `make dev`: Start Docker services
- `make down`: Stop Docker services
- `make logs`: View logs for the web container
- `make shell`: Open a bash shell inside the web container
- `make lint`: Run ESLint
- `make typecheck`: Run TypeScript type-checking
- `make format`: Format code with Prettier
- `make test`: Run unit tests
- `make e2e`: Run Playwright E2E tests
- `make db-generate`: Generate Prisma client
- `make db-push`: Push Prisma schema to SQLite
- `make db-seed`: Seed database
- `make db-studio`: Open Prisma Studio
- `make reset`: Destroy all volumes and restart services

## Database Setup

The SQLite database file (`dev.db`) is automatically created inside the `/app/data` volume within the container. You do not need to manually configure it. The initial startup runs `prisma db push` and `prisma db seed` automatically.

## Notes for Future Development

- **Media Uploads**: Future uploaded files (e.g., driver licenses, receipts) will be stored in the database using Prisma `Bytes` fields. Do not use local filesystem media storage.
- **Features Not Implemented**: Dashboard cards, vehicle registry, driver management, trips, maintenance, reports, RBAC, and auth screens are deliberately NOT built yet. They will be added in subsequent milestones.
