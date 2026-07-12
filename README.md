<!-- ═══════════════════════════════ HERO ═══════════════════════════════ -->

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/hero-dark.svg" />
    <img src="assets/hero-light.svg" width="100%" alt="Hackathon 2026 — Team Maitri · Odoo Hackathon 2026" />
  </picture>
</div> 

<br/>

<!-- ═══════════════════════════════ TEAM ═══════════════════════════════ -->

<div align="center">
  <h2>👥 Meet the Team</h2>
  
  <a href="https://www.linkedin.com/in/maitri-kansagra-b16a3b281/" target="_blank">
    <img src="assets/card-maitri.svg" width="80%" alt="Maitri" />
  </a>
  <br/>
  <a href="https://www.linkedin.com/in/maitri-kansagra-b16a3b281/" target="_blank">
    <img src="https://img.shields.io/badge/LinkedIn-Maitri_Kansagra-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="Maitri LinkedIn" />
  </a>
  <br/><br/><br/>
  
  <a href="https://www.linkedin.com/in/devgna-vyas/" target="_blank">
    <img src="assets/card-vyas.svg" width="80%" alt="Vyas Devgna" />
  </a>
  <br/>
  <a href="https://www.linkedin.com/in/devgna-vyas/" target="_blank">
    <img src="https://img.shields.io/badge/LinkedIn-Vyas_Devgna-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="Vyas LinkedIn" />
  </a>
  <br/><br/>
</div>

<br/>
<div align="center">
  <img src="assets/divider.svg" width="100%" alt="" />
</div>
<br/>

<!-- ═══════════════════════════════ OVERVIEW ═══════════════════════════════ -->

<div align="center">
  <h2>🎯 Project Overview</h2>
</div>

> [!NOTE]
> **TransitOps — Smart Transport Operations Platform.** Our Odoo Hackathon 2026 virtual-round submission.

Logistics teams still run their fleets on spreadsheets and paper logbooks, which quietly cause scheduling clashes, idle vehicles, missed maintenance, expired driver licenses, and murky costs. 

**TransitOps** replaces that with one platform for the full transport lifecycle — vehicles, drivers, dispatch, maintenance, fuel, and expenses — with business rules enforced automatically and operational insight on a live dashboard.

<div align="center">
  <br/>
  <table>
    <tr>
      <td align="center">👔 <b>Fleet Manager</b></td>
      <td align="center">🚚 <b>Driver / Dispatcher</b></td>
      <td align="center">🛡️ <b>Safety Officer</b></td>
      <td align="center">📈 <b>Financial Analyst</b></td>
    </tr>
  </table>
  <p><em>Each role features bespoke, role-based access to the tools they need.</em></p>
</div>

<br/>
<div align="center">
  <img src="assets/divider.svg" width="100%" alt="" />
</div>
<br/>

<!-- ═══════════════════════════ DESIGN SHOWCASE ═══════════════════════════ -->

<div align="center">
  <h2>✨ Design Showcase</h2>
</div>

<p align="center">
  <img src="docs/assets/organic-showcase-header.svg" alt="TransitOps organic dashboard prototype animated header" width="100%" />
</p>

TransitOps uses an organic, calm, operations-focused design language: soft rice-paper surfaces, moss green actions, terracotta accents, rounded dashboard cards, natural motion, and generous whitespace. The interface direction is designed to make complex transport operations feel composed, readable, and human.

<p align="center">
  <img src="docs/assets/transitops-design-showcase.png" alt="TransitOps organic dashboard prototype showing dashboard and module UI elements" width="100%" />
</p>

<p align="center">
  <img src="docs/assets/organic-motion-divider.svg" alt="Organic animated divider" width="100%" />
</p>

### Visual Direction

- Organic dashboard layout with calm, high-density operational visibility.
- Moss green primary actions, terracotta secondary accents, rice-paper surfaces, and soft timber borders.
- Rounded cards, pill controls, tactile status badges, botanical details, and subtle motion.
- Main focus: dashboard clarity, smart dispatch readiness, compliance visibility, analytics, and operational control.

> This showcase represents the intended visual direction before full product development begins.

<br/>
<div align="center">
  <img src="assets/divider.svg" width="100%" alt="" />
</div>
<br/>

<!-- ══════════════════════════════ TECH STACK ══════════════════════════════ -->

<div align="center">
  <h2>⚡ Tech Stack</h2>
  <p>A lightweight, locally runnable hackathon POC with a minimal full-stack architecture.</p>
  
  <p>
    <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
    <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  </p>
</div>

<br/>

### 🛠️ Core Technologies

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js App Router | Full-stack app routing, pages, server actions/API routes |
| **Language** | TypeScript | Type-safe business logic, UI, and model interfaces |
| **Database** | SQLite | Lightweight local database for easy testing and demos |
| **ORM** | Prisma | Schema modelling, migrations, queries, and seed data |
| **Auth/RBAC** | Custom Credentials | DB-backed users, roles, and permissions |
| **UI** | Tailwind CSS + shadcn/ui | Dark responsive dashboard UI |
| **Charts** | Recharts | KPI and analytics visualizations |
| **PDF** | `@react-pdf/renderer` | Structured report PDF generation |
| **CSV** | Server-side export | Data exports for fleet, trips, and expenses |
| **Media** | DB-backed storage | Uploaded documents, licences, receipts (no local FS) |
| **Validation** | Zod + Service Layer | Form validation and strict business rules |
| **Icons** | lucide-react | Navigation and UI icons |
| **Deployment** | Docker | Containerized deployment and easy runner setup |

<br/>

### 💡 Why this stack?
- **Intentionally minimal** for a hackathon POC.
- **Avoids extra infrastructure** like separate backend servers, cloud storage, or hosted databases.
- **SQLite + Prisma** keeps the app trivial to run locally while supporting relational data.
- **Full lifecycle support** for RBAC, vehicles, drivers, trips, maintenance, and analytics.
- **Easy to demo**, test, and record locally.

<br/>
<div align="center">
  <img src="assets/divider.svg" width="100%" alt="" />
</div>
<br/>

<!-- ═══════════════════════════ SUBMISSION STANDARD ═══════════════════════════ -->

<div align="center">
  <h2>🏆 Submission Standard</h2>
</div>

> [!IMPORTANT]
> The final repository will contain only reviewer-relevant material to ensure a perfect presentation.

| &nbsp; | What reviewers will find here |
| :---: | :--- |
| 📦 | **Source code** required to run the solution |
| 🧭 | A precise **problem and solution narrative** |
| ⚙️ | **Reproducible** setup and demo instructions |
| 🏗️ | **Architecture** and data-flow documentation |
| ✅ | **Validation**, error handling, and test evidence |
| 📈 | **Meaningful commit history** from both team members |
| 🖼️ | **Screenshots** or a short demo link when available |

<br/>

<!-- ═══════════════════════════════ FOOTER ═══════════════════════════════ -->

<div align="center">
  <img src="assets/footer.svg" width="100%" alt="" />
</div>
