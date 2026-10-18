# Ardhnarishwar Job Portal

A full-stack, AI-powered recruitment platform that connects **candidates**, **recruiters** and **admins** in one place. It covers job posting and applications, AI-driven interviews, resume tools, real-time chat, a global workforce hub and paid recruiter plans.

> **Release:** 14 Oct 2026 (`JOBPORTAL14OCT`)

---

## Features

**Candidates**
- Register / login, email verification and password reset
- Browse, filter, save and apply to jobs
- Resume scanner, CV builder / maker and AI job matching
- Nova AI interview and video interview sessions, with results and review
- Real-time chat with recruiters, applied-jobs tracking, complaints

**Recruiters**
- Company creation and setup, job posting, JD Maker
- Applicant management, find candidates, CV shortlisting, resume matching
- Send interviews, view interview results, recruiter dashboard
- Mass hiring / workforce hub, auto-reply, blacklist
- Pricing plans with Razorpay payments

**Admin panel**
- Dashboard, access keys, recruiter / candidate verification
- Edited-profile review, mass hiring, complaints and chat monitoring

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend (candidate + recruiter) | React, Vite, Redux Toolkit, Tailwind CSS, Radix UI, Framer Motion, Socket.IO client |
| Admin frontend | React, Vite, Redux Toolkit, Tailwind CSS, Radix UI |
| Backend | Node.js, Express, Socket.IO |
| Database | MySQL (`mysql2`) |
| AI | Groq API, optional local Ollama |
| Payments | Razorpay |
| Email | Nodemailer (SMTP / Gmail) |
| Auth | JWT, bcrypt, cookies |

---

## Repository Structure

```
.
├── backend14OCt/          # Express API, Socket.IO, MySQL models, migrations
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── utils/             # mailer, Groq/Ollama clients, interview logic, DB pool
│   ├── scripts/           # schema setup and migration scripts
│   └── uploads/           # runtime uploads (git-ignored)
├── frontend14OCT/         # Candidate and recruiter web app (Vite + React)
├── admin-frontend14OCt/   # Admin panel (Vite + React)
└── .gitignore
```

---

## Prerequisites

- Node.js 18 or newer and npm
- MySQL 8 (or compatible)
- A Groq API key (or a local Ollama install) for AI features
- SMTP credentials (e.g. a Gmail app password) for emails
- Razorpay keys (only if you use payments)

---

## Getting Started

### 1. Clone

```bash
git clone https://github.com/ardhnarishwarcompany-cmd/Ardhnarishwar-Job-Portal.git
cd Ardhnarishwar-Job-Portal
```

### 2. Backend

```bash
cd backend14OCt
npm install
```

Create a `.env` file in `backend14OCt/` (see [Environment Variables](#environment-variables)), create an empty MySQL database, then:

```bash
npm run db:repair   # creates / repairs the required tables
npm run dev         # starts the API with nodemon
```

The API listens on `PORT` (default `5001`). On startup the server also runs the schema check, and creates a default admin account if none exists. **Change the default admin password immediately.**

### 3. Frontend (candidate and recruiter)

```bash
cd frontend14OCT
npm install
npm run dev
```

### 4. Admin frontend

```bash
cd admin-frontend14OCt
npm install
npm run dev
```

Vite prints the local URL (usually `http://localhost:5173`). If you run both frontends at once, the second one picks the next free port.

---

## Environment Variables

Never commit real `.env` files. They are git-ignored.

### `backend14OCt/.env`

| Variable | Purpose |
|----------|---------|
| `PORT` | API port (default `5001`) |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection |
| `JWT_SECRET` | Secret used to sign auth tokens |
| `GROQ_API_KEY` | Groq API key for AI features |
| `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_TIMEOUT_MS`, `OLLAMA_DISABLED` | Optional local Ollama setup |
| `SMTP_HOST`, `SMTP_PORT`, `GMAIL_USER`, `GMAIL_PASS`, `FROM_EMAIL`, `FROM_NAME`, `SMTP_TLS_REJECT_UNAUTHORIZED` | Email (OTP, verification, password reset, interview results) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Default admin account |
| `CORS_ORIGINS`, `FRONTEND_URL`, `ADMIN_FRONTEND_URL` | Allowed origins and links used in emails |
| `RAZORPAY_MODE`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Razorpay payments |

### `frontend14OCT/.env` and `admin-frontend14OCt/.env`

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Base URL of the backend API |
| `VITE_MAPS_API_KEY` | Maps / address autocomplete key |

Use `.env.production` for production values.

---

## API Overview

All routes are served by the Express backend:

| Prefix | Area |
|--------|------|
| `/api/user` | Auth, profile, resumes |
| `/api/company` | Companies |
| `/api/job` | Jobs |
| `/api/application` | Job applications |
| `/api/chat`, `/api/messaging` | Chat and messaging |
| `/api/interviews` | Recruiter interviews |
| `/api/ai-interview`, `/api/nova-interview` | AI interviews |
| `/api/ai` | AI tools (JD maker, resume matching, etc.) |
| `/api/recruiter` | Recruiter features |
| `/api/workforce` | Global workforce hub |
| `/api/payments` | Razorpay payments |
| `/api/complaints` | Complaints |
| `/api/notifications` | Notifications |
| `/api/contact` | Contact requests |
| `/api/options` | Dropdown option pools |
| `/api/admin` | Admin operations |
| `/uploads` | Uploaded files |

---

## Build and Deploy

Build the frontends:

```bash
cd frontend14OCT && npm run build
cd ../admin-frontend14OCt && npm run build
```

Serve each `dist/` folder from your web server (an `.htaccess` for SPA routing is included for Apache). Run the backend with a process manager such as PM2 and set production values in `.env`.

Before going live:
- Use strong, unique values for `JWT_SECRET` and the admin password
- Restrict `CORS_ORIGINS` to your real domains
- Keep `backend14OCt/uploads/` outside version control and back it up separately

---

## Security Notes

- `.env` files and `uploads/` (which can hold user resumes and ID documents) are git-ignored. Do not commit them.
- Rotate any key that has ever been exposed publicly.

---

## License

All rights reserved. Contact the repository owner for usage permission.
