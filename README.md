<!-- ═══════════════════════════════ HERO ═══════════════════════════════ -->

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/hero-dark.svg" />
  <img src="assets/hero-light.svg" width="100%" alt="Hackathon 2026 — Team Maitri · Odoo Hackathon 2026 · Virtual Round. Building the next great solution — one commit at a time. Pre-Round Bootstrap · Stable Branch: main · 2 Builders" />
</picture>

</div>

<br/>

<!-- ═══════════════════════════════ OVERVIEW ═══════════════════════════════ -->

## Overview

> [!NOTE]
> **TransitOps — Smart Transport Operations Platform.** Our Odoo Hackathon 2026 virtual-round submission.

Logistics teams still run their fleets on spreadsheets and paper logbooks, which quietly cause scheduling clashes, idle vehicles, missed maintenance, expired driver licenses, and murky costs. **TransitOps** replaces that with one platform for the full transport lifecycle — vehicles, drivers, dispatch, maintenance, fuel, and expenses — with business rules enforced automatically and operational insight on a live dashboard.

**Built for four roles:** Fleet Manager, Driver/Dispatcher, Safety Officer, and Financial Analyst — each with role-based access to the tools they need.

Setup instructions, architecture, demo evidence, and the contribution summary will land here as the build progresses.

<div align="center">
<img src="assets/divider.svg" width="100%" alt="" />
</div>

<!-- ══════════════════════════════ TECH STACK ══════════════════════════════ -->

## Tech Stack

The project is designed as a lightweight, locally runnable hackathon POC with a minimal full-stack architecture.

1. **Framework**: Next.js App Router
   - Used for the application shell, routing, server-rendered pages, server actions/API routes, and local POC workflow.
2. **Language**: TypeScript
   - Used for safer business logic, typed enums, role checks, model interfaces, and validation.
3. **Database**: SQLite
   - Used as the local self-contained database.
   - Requires no separate database server and is suitable for local testing, demos, and recording the submission video.
4. **ORM**: Prisma
   - Used for schema modelling, migrations, relational queries, and seed data.
5. **Authentication and RBAC**: Custom credentials-based authentication
   - DB-backed users, roles, and permissions.
   - Session/cookie-based access control.
   - Role checks are enforced in application logic, not only hidden in the UI.
6. **UI**: Tailwind CSS, shadcn/ui, and Radix UI primitives where applicable
   - Used for the dark operations dashboard, cards, tables, dialogs, forms, badges, and responsive layout.
7. **Charts and Analytics**: Recharts
   - Used for dashboard KPIs, fleet status charts, cost trends, fuel efficiency, ROI, and expense breakdowns.
8. **PDF Export**: @react-pdf/renderer
   - Used for accurate programmatic PDF generation.
   - Does not rely on browser print for reports.
   - Reports include structured headers, KPI sections, tables, totals, and export-ready formatting.
9. **CSV Export**: Native application logic / server-side CSV generation
   - Used for fleet, trip, expense, and compliance exports.
10. **Media Storage**: Database-backed file storage
    - Uploaded vehicle documents, driver licences, receipts, invoices, and other files are stored in the database or database-equivalent persistence layer.
    - Avoids local filesystem media storage for uploaded files.
    - Includes metadata such as filename, MIME type, size, uploaded by, and upload date.
11. **Validation**: Zod and server-side validation logic
    - Used for form validation, dispatch rules, trip completion rules, maintenance workflow checks, and expense validation.
12. **Icons**: lucide-react
    - Used for sidebar navigation, status indicators, cards, and action buttons.
13. **Local Development**: npm scripts, Prisma migrate/seed commands, and one local app process with SQLite
    - No external cloud services required for the POC.

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js App Router | Full-stack app routing, pages, server actions/API routes |
| Language | TypeScript | Type-safe business logic and UI |
| Database | SQLite | Lightweight local database |
| ORM | Prisma | Schema, migrations, queries, seed data |
| Auth/RBAC | Custom credentials auth | Demo login, roles, permissions, protected routes |
| UI | Tailwind CSS + shadcn/ui | Dark responsive dashboard UI |
| Charts | Recharts | KPI and analytics visualizations |
| PDF | @react-pdf/renderer | Structured report PDF generation |
| CSV | Server-side CSV export | Data exports |
| Media | Database-backed file storage | Documents, licences, receipts, invoices |
| Validation | Zod + service-layer checks | Forms and business rules |
| Icons | lucide-react | Navigation and UI icons |

### Why this stack?

- It is intentionally minimal for a hackathon POC.
- It avoids extra infrastructure such as separate backend servers, cloud storage, hosted databases, or object storage.
- SQLite keeps the app easy to run locally.
- Prisma makes relational data and seed data fast to manage.
- The stack supports all required modules: RBAC, vehicles, drivers, trips, maintenance, fuel, expenses, analytics, PDF/CSV export, compliance alerts, and audit logs.
- The architecture is easy to demo, test, and record locally.

### POC Architecture

```text
Browser
  ↓
Next.js App Router
  ↓
Server Actions / API Routes
  ↓
Business Services
  ↓
Prisma ORM
  ↓
SQLite Database
  ├── Business records
  ├── Users and roles
  ├── Uploaded media
  ├── Audit logs
  └── Compliance alerts
```

<div align="center">
<img src="assets/divider.svg" width="100%" alt="" />
</div>

<!-- ═══════════════════════════════ TEAM ═══════════════════════════════ -->

## Team

<div align="center">

<img src="assets/card-maitri.svg" width="49.4%" alt="Maitri — Team Leader: problem selection and product direction, UI and UX, testing and validation, portal submission and final demo" /><img src="assets/card-vyas.svg" width="49.4%" alt="Vyas Devgna — Team Member: system architecture, backend design and implementation, integration" />

</div>

> Both members will contribute through their own GitHub identities. The latest stable implementation will remain on `main`.

<div align="center">
<img src="assets/divider.svg" width="100%" alt="" />
</div>

<!-- ═══════════════════════════ SUBMISSION STANDARD ═══════════════════════════ -->

## Submission Standard

> [!IMPORTANT]
> The final repository will contain only reviewer-relevant material:

| &nbsp; | What reviewers will find here |
| :---: | :--- |
| 📦 | Source code required to run the solution |
| 🧭 | A precise problem and solution narrative |
| ⚙️ | Reproducible setup and demo instructions |
| 🏗️ | Architecture and data-flow documentation |
| ✅ | Validation, error handling, and test evidence |
| 📈 | Meaningful commit history from both team members |
| 🖼️ | Screenshots or a short demo link when available |

<!-- ═══════════════════════════════ FOOTER ═══════════════════════════════ -->

<div align="center">

<img src="assets/footer.svg" width="100%" alt="" />

</div>
