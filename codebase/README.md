# TransitOps: Smart Transport Operations Platform 🚚💨

TransitOps is an AI-powered, compliance-driven fleet management and logistics platform built for the **Hackathon 2026**. It solves real-world logistics challenges through automated dispatching, OCR-powered receipt tracking, strict compliance monitoring, and robust financial analytics.

![Design System](../hackathon%20work/Design_System.png)

## 🌟 Key Features

### 1. Smart Dispatch Assistant
- Recommends the optimal Vehicle & Driver pair for any trip based on:
  - **Distance & Cargo Weight** compatibility.
  - **Profitability Margin** (calculating fuel, tolls, and maintenance reserves).
  - **Compliance Check** (verifying insurance, pollution, fitness, and license expiries).
- Real-time routing visualization using **Leaflet** & **OpenStreetMap** with offline-safe deterministic fallback calculations.

### 2. Tesseract.js OCR Integration
- Automated Fuel Log and Expense submission.
- Drivers simply upload a photo of a receipt, and the system uses on-device OCR to extract amounts, dates, and vendor information directly into the form.

### 3. Strict Role-Based Access Control (RBAC)
Four perfectly sandboxed roles mapping to real-world operations:
1. **Fleet Manager**: Full dispatch control, vehicle acquisition, and maintenance scheduling.
2. **Driver**: View assigned trips, log fuel receipts via OCR, and submit operational expenses.
3. **Safety Officer**: Manage driver compliance, track safety scores, and resolve active alerts.
4. **Financial Analyst**: Complete visibility over revenue, fuel costs, maintenance overhead, and margins.

### 4. Automated Compliance & Reminders
- One-click System Compliance Scans instantly detect expiring documents or missing licenses.
- Background **Cron Jobs** powered by `nodemailer` send automated email digests for drivers whose licenses expire within 15 days.

### 5. PDF Reporting Engine
- Server-side generated PDF reports via `@react-pdf/renderer`.
- Instantly export Fleet Status and Compliance logs for auditing.

### 6. Premium "Organic Dark" Aesthetics
- Custom TailwindCSS design system using a moss/forest aesthetic (Glassmorphism + Dark Mode).
- Interactive Recharts components, including a custom Half-Donut gauge for Fleet Maintenance Health.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (via Prisma ORM)
- **Styling**: Tailwind CSS + Shadcn UI
- **Mapping**: React Leaflet + OpenStreetMap
- **OCR**: Tesseract.js
- **PDF Generation**: React-PDF
- **Email**: Nodemailer
- **Testing**: Vitest + Playwright

---

## 🚀 Quick Start

To spin up the environment immediately:

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

### Pre-configured Demo Users (Password: `password123`)
- `fleet@transitops.local` (Fleet Manager)
- `driver@transitops.local` (Driver)
- `safety@transitops.local` (Safety Officer)
- `finance@transitops.local` (Financial Analyst)

---

## 🏗️ Architecture & Philosophy
TransitOps favors **simplicity and robustness** over microservice complexity. 
- A monolithic Next.js Server Actions backend handles all business logic.
- Real-world constraints (like database uniqueness on license numbers, or preventing retirement of active vehicles) are enforced both at the Prisma schema level and inside the server actions.
- The UI is server-rendered wherever possible, drastically reducing client-side bundle size, saving heavy libraries (like Tesseract and Leaflet) exclusively for the routes that require them.
