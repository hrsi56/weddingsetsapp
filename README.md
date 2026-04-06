<div align="center">

# 💍 Event & RSVP Management Platform

**A production-grade, full-stack platform for end-to-end event management.**  
Built for a real wedding. Handles 200+ guests, live seating, and community features — all in a single unified deployment.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.11x-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://supabase.com/)
[![Docker](https://img.shields.io/badge/Docker-Unified_Build-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Render](https://img.shields.io/badge/Deployed_on-Render-46E3B7?style=flat-square&logo=render&logoColor=black)](https://render.com/)

[**Live Demo →**](https://www.yarden-tovat.info) &nbsp;·&nbsp; [Backend API Docs →](https://www.yarden-tovat.info/docs)

</div>

---

## ✨ Why This Project

Most RSVP tools are either too generic or too locked down. This platform was designed from the ground up for a **real event** with real constraints: Hebrew RTL layout, custom seating logic, live admin workflows, and privacy-first data handling — all served from a single Docker container.

---

## 🗂️ Project Structure

```
project-root/
├── backend/                  # FastAPI application
│   ├── main.py               # API routes, auth middleware, PII masking
│   ├── crud.py               # Database operations & seat-locking logic
│   ├── db.py                 # SQLAlchemy models & session management
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── sheets_repo.py        # Google Sheets integration (blessings, singles)
│   └── requirements.txt
│
├── frontend/                 # React + Vite application
│   └── src/
│       ├── App.tsx           # Root layout, routing, admin auth flow
│       ├── utils/
│       │   └── adminAuth.ts  # Decoupled token helpers (no circular imports)
│       ├── components/
│       │   ├── AdminScreen.tsx       # Live admin dashboard
│       │   ├── RSVPScreen.tsx        # Guest self-service RSVP
│       │   ├── EventGate.tsx         # Graphical invitation card
│       │   ├── EventGate_not.tsx     # Auto-generated text invitation (Hebrew calendar)
│       │   ├── QRDonateScreen.tsx    # Dynamic QR gift hub
│       │   ├── SinglesCornerScreen.tsx
│       │   └── PhotoShareScreen.tsx
│       ├── eventD.ts         # ⚙️  Single config file for all event details
│       └── theme.ts          # Chakra UI design system
│
├── Dockerfile                # Multi-stage build: Vite → FastAPI static files
├── render.yaml               # One-click Render deployment blueprint
└── docker-compose.yml        # Local development environment
```

> **Architecture note:** `adminAuth.ts` is intentionally extracted from `App.tsx` to break a circular import between `App` → `AdminScreen` → `App`. Both files import from the utility module instead.

---

## 🚀 Feature Highlights

### 🎫 Smart RSVP & Guest Management
- **Phone-based authentication** — guests confirm attendance, party size, and dietary needs with zero account creation
- **Collision-safe seat assignment** — the backend uses a transactional seat-locking pattern to prevent double-booking under concurrent admin sessions
- **Live admin dashboard** — debounced server-side search, capacity badges, inline guest creation, and a 3-stage seating workflow (details → table selection → confirmation)
- **PII masking at the API layer** — last names and phone numbers are masked (`Israel I'`, `*******123`) *in the backend response*, before data ever reaches the browser. The SQLAlchemy objects are never mutated directly to prevent accidental DB writes of censored values

### 🔐 Secure Admin Gateway
- Phone numbers are stored exclusively in a **server-side environment variable** (`ADMIN_PHONES`) — never shipped to the client
- Successful auth returns an **HMAC-SHA256 signed token** (`timestamp.signature`) with a 12-hour TTL
- All admin API routes are protected by a FastAPI `require_admin` dependency that validates the cryptographic signature and expiry on every request
- Tokens are stored in `sessionStorage` (auto-cleared on tab close) and injected via a dedicated `adminAuth.ts` utility, keeping auth logic cleanly separated from UI components

### 🎨 Interactive Community Modules
| Module | Description |
|--------|-------------|
| **Magnetic Blessings Feed** | Guests write blessings that appear on a horizontally scrolling carousel. A custom math-based "snap" function auto-centers the nearest card |
| **Singles Corner** | Anonymous community board for single guests to post short profiles |
| **Dynamic Gift Hub** | QR codes for Bit & PayBox that randomly rotate between two payment link sets to avoid service throttling |
| **Photo Sharing Portal** | Direct link to a shared Google Photos album |
| **Hebrew Event Gate** | Configuration-driven invitation with automatic Hebrew calendar conversion and "evening date" (`אור ל...`) detection |

---

## 🏗️ Architecture & Data Flow

```
Browser
  │
  ├─ GET /                    → Serves React SPA (static/index.html)
  ├─ POST /api/users/login    → Guest auth (public)
  ├─ POST /api/users/admin-login → Verifies phone vs. env var, returns HMAC token
  │
  └─ All /api/admin/* routes
       └─ require_admin dependency
            ├─ Validates x-admin-token header (HMAC-SHA256 + TTL)
            ├─ Queries PostgreSQL (Supabase) via SQLAlchemy
            ├─ Masks PII in response dict (never mutates ORM objects)
            └─ Returns masked JSON to client

Community features (Blessings, Singles, Feedback)
  └─ Google Sheets API via Service Account (gspread)
```

**Unified deployment:** A multi-stage Dockerfile compiles the Vite frontend (`npm run build`) and copies the output into the FastAPI container. A catch-all `/{catchall:path}` route serves React Router's SPA navigation transparently.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Chakra UI, Framer Motion |
| Backend | Python, FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL via Supabase |
| External APIs | Google Sheets API (gspread + oauth2client) |
| Auth | Stateless HMAC-SHA256 tokens (no external identity provider) |
| DevOps | Docker (multi-stage), Render Web Service, render.yaml blueprint |

---

## ⚙️ Local Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### 1. Clone & configure

```bash
git clone https://github.com/your-username/your-repo.git
cd project-root
cp .env.example .env   # fill in your values (see table below)
```

### 2. Start with Docker Compose

```bash
docker-compose up --build
```

The app will be available at `http://localhost:8000`.  
FastAPI docs: `http://localhost:8000/docs`

### 3. Or run frontend & backend separately (dev mode)

```bash
# Terminal 1 – Backend
cd backend
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000

# Terminal 2 – Frontend (hot reload)
cd frontend
npm install
npm run dev          # → http://localhost:5173
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (e.g. Supabase) |
| `ADMIN_PHONES` | ✅ | Comma-separated list of authorized admin phone numbers. **Never exposed to the client.** |
| `ADMIN_SECRET` | ✅ | Random secret string used to sign HMAC admin tokens. Minimum 32 characters recommended. |
| `GCP_SA_JSON` | ✅ | Base64-encoded Google Service Account JSON for Sheets integration |

> **Supabase tip:** Use the `?sslmode=require` suffix on your connection string to avoid connection resets.

---

## 🗄️ Database Setup

Tables are created automatically by `init_db()` on first startup — no migrations needed.

**Required tables** (auto-generated by SQLAlchemy):

| Table | Key columns |
|-------|------------|
| `users` | `id`, `name`, `phone`, `Phone2`, `is_coming`, `num_guests`, `area`, `user_type` |
| `seats` | `id`, `row`, `col`, `area`, `status`, `owner_id` |

---

## 📊 Google Sheets Setup

1. Enable **Google Sheets API** and **Google Drive API** in Google Cloud Console
2. Create a **Service Account** → download JSON credentials → Base64-encode the file contents → set as `GCP_SA_JSON`
3. Create a Google Sheet named exactly **`wedding`** with three worksheet tabs:
   - `ברכות` — Blessings
   - `רווקים_רווקות` — Singles Corner
   - `היכרויות` — Feedback
4. Share the sheet with your Service Account email (Editor permission)

---

## 🌐 Deployment (Render)

The `render.yaml` blueprint handles everything automatically:

1. Push to GitHub
2. Connect the repo to [Render](https://render.com)
3. Render detects the `render.yaml` and provisions a Web Service
4. Add the four environment variables in the Render dashboard
5. Deploy — done

First deploy triggers `init_db()` which creates all tables automatically.

---

## 🔒 Security Design Decisions

**Why not OAuth / JWT libraries?**  
This is a single-event, short-lived deployment. A stateless HMAC-SHA256 token provides genuine endpoint protection without adding dependency surface area or requiring a token revocation infrastructure. All sensitive endpoints validate the token signature cryptographically on every request.

**Anti-scraping on the search endpoint:**  
Phone number searches require exactly 10 digits (exact match only). Partial numeric queries (e.g. `054`) return an empty array at the API layer before touching the database.

**SQLAlchemy mutation safety:**  
PII masking builds a new `dict` from the ORM object instead of modifying object attributes directly. Mutating `user.name` directly would mark the field as `dirty`, potentially flushing the censored value to the database on the next session operation.

---

## 📄 License

This project is open source. See [LICENSE](LICENSE) for details.

---

<div align="center">
  <sub>Built with care for a real wedding 💐</sub>
</div>
