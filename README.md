# Prepify — AI-Powered Interview Preparation Platform

**Prepify** is a full-stack, enterprise-grade AI career preparation platform designed to help candidates prepare for job interviews with surgical precision. Candidates compare their real PDF resumes and profiles against target job descriptions to receive evidence-based match evaluations, technical interview questions with evaluation criteria, behavioral scenarios with STAR frameworks, prioritized skill gap assessments, structured preparation roadmaps, and tailored ATS-friendly resume PDFs.

---

## 🏛️ System Architecture

Prepify is engineered with a strict client/server separation:

```
prepify/
├── client/                     # Frontend Application (React 19, Vite, SCSS)
│   ├── src/
│   │   ├── components/         # Persistent UI (Header, Navigation, Dropdown)
│   │   ├── features/
│   │   │   ├── auth/           # Authentication state, context, pages & guards
│   │   │   └── interview/      # Interview strategist, report page, API services
│   │   ├── layouts/            # RootLayout with persistent Header and Outlet
│   │   └── style/              # SaaS design system (Navy & Indigo palette)
│   ├── .env.example            # Client environment configuration
│   └── package.json
│
├── server/                     # Backend API & AI Engine (Node.js, Express, MongoDB)
│   ├── src/
│   │   ├── config/             # MongoDB connection with graceful degradation
│   │   ├── controllers/        # Auth & Interview report controllers
│   │   ├── middlewares/        # JWT auth, token blacklist & Multer PDF filters
│   │   ├── models/             # Mongoose schemas (User, TokenBlackList, InterviewReport)
│   │   ├── routes/             # REST endpoints (/api/auth, /api/interview)
│   │   └── services/           # Gemini AI SDK integration & Puppeteer PDF generator
│   ├── tests/                  # Automated integration tests (node:test + supertest)
│   ├── .env.example            # Backend environment configuration
│   ├── server.js               # Server initialization and process lifecycle
│   └── package.json
│
└── README.md
```

---

## 🚀 Key Features & Implementation Highlights

### 1. Robust Authentication & Session Security
- **HTTP-Only Cookies:** Secure JWT token issuance with `httpOnly: true`, `sameSite`, and production HTTPS protection.
- **Token Blacklisting with TTL Expiry:** Logout invalidates sessions immediately via MongoDB blacklist with automatic TTL cleanup (`expireAfterSeconds: 604800`).
- **Authorization Middleware:** Supports both HTTP-only cookie extraction and optional `Authorization: Bearer <token>` header for developer workflows.
- **Input Validation:** Enforces strict email verification, 6+ character passwords, and 3+ character trimmed usernames. Prevents duplicate usernames and emails with specific 409 Conflict feedback.

### 2. Resume Ingestion & Validation
- **Memory-Stored Multer:** Ingestion limit enforced at 5MB.
- **Magic-Byte PDF Verification:** Rejects non-PDFs and disguised binaries by inspecting `%PDF` buffer headers.
- **Text Extraction & Sanitization:** Uses `pdf-extraction` to extract text content, rejecting empty or unreadable scanned documents.
- **Interactive File Upload:** Drag-and-drop zone with instant file name display, size calculation (e.g. `245 KB`), remove button, and replace action.

### 3. Google Gemini AI Strategy Engine
- **Structured JSON Schema:** Configured using `@google/genai` with strict response schema enforcement.
- **Zod Schema Validation:** Dual-layer validation ensures every AI output contains valid match scores, technical evaluation criteria, behavioral STAR models, severity enums (`low`, `medium`, `high`), and day-by-day tasks.
- **Transient Error Resilience:** Automatically handles `503`, `429`, and `UNAVAILABLE` rate limits with exponential backoff retry.
- **Configurable Models:** Supports `gemini-2.5-flash`, `gemini-1.5-flash`, and `gemini-2.0-flash` via `GEMINI_MODEL`.

### 4. Tailored ATS Resume PDF Generation
- **Puppeteer Headless Engine:** Runs with `--no-sandbox` and `--disable-dev-shm-usage` for cross-platform stability.
- **Print-Optimized HTML/CSS Template:** Generates ATS-friendly resumes with standard typography, clear hierarchy, contact blocks, summaries, core competencies, experience, and education without fabricating fake credentials.

### 5. High-Impact SaaS UI/UX Design
- **Theme:** Deep navy backgrounds (`#0B0F19`, `#111827`) paired with a restrained indigo/violet accent (`#6366F1`).
- **Live Counters:** Dynamic character counters for job descriptions (up to 5,000 characters).
- **Interactive Roadmap:** Interactive checklist allowing candidates to mark tasks as completed in the UI with a real-time progress bar.
- **Question Accordions:** Individual expand/collapse and global "Expand All / Collapse All" toggle.
- **User Isolation:** All reports are strictly scoped to the authenticated user ID. Attempting to view another user's report is blocked with 404/unauthorized.

---

## 🛠️ Environment Configuration

### Backend: `server/.env`
Create a `.env` file inside `server/` (copy from `server/.env.example`):

```ini
# Server Port
PORT=3000

# Environment Mode: development | production
NODE_ENV=development

# MongoDB Connection String (Atlas or Local)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/prepify?retryWrites=true&w=majority

# JWT Authentication Secret (32+ random characters)
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Gemini Model Name (Default: gemini-2.5-flash)
GEMINI_MODEL=gemini-2.5-flash

# Frontend Origin for CORS
FRONTEND_URL=http://localhost:5173
```

### Client: `client/.env` (Optional)
If your backend is running on a custom port or domain, create `client/.env`:

```ini
VITE_API_URL=http://localhost:3000
```

---

## 📋 Prerequisites & External Setup

### 1. MongoDB Atlas Configuration
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/) and sign up or log in.
2. Create a free **M0 Shared Cluster**.
3. Under **Security → Database Access**, create a user with read/write privileges.
4. Under **Security → Network Access**, add `0.0.0.0/0` (or your IP) to allowed IP addresses.
5. Under **Deployments → Database → Connect → Drivers**, copy the connection string and paste it into `MONGODB_URI` in `server/.env`.

### 2. Google Gemini API Key Setup
1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Click **Get API key** and generate a new key.
3. Paste the key into `GEMINI_API_KEY` in `server/.env`.

---

## 💻 Running the Application

### 1. Start Backend Server
```bash
cd server
npm run dev
```
- Server starts at `http://localhost:3000`
- Health check available at `http://localhost:3000/api/health`

### 2. Start Frontend Client
```bash
cd client
npm run dev
```
- Client starts at `http://localhost:5173`

---

## 🧪 Automated Testing & Verification

The backend includes a comprehensive integration test suite running on an in-memory MongoDB server:

```bash
cd server
npm test
```

### Verified Test Results:
```text
▶ Auth API Integration Tests
  ✔ POST /api/auth/register - rejects missing fields
  ✔ POST /api/auth/register - rejects short password
  ✔ POST /api/auth/register - registers user and sets HTTP-only cookie
  ✔ POST /api/auth/register - rejects duplicate email
  ✔ POST /api/auth/login - rejects invalid credentials
  ✔ POST /api/auth/login - succeeds with correct credentials and returns session
  ✔ GET /api/auth/get-me - returns authenticated user details
  ✔ POST /api/auth/logout - blacklists token and clears cookie
✔ Auth API Integration Tests (2.7s)

▶ Interview API Integration Tests
  ✔ GET /api/interview - rejects unauthenticated request with 401
  ✔ POST /api/interview - rejects request missing job description with 400
  ✔ GET /api/interview/report/:id - handles invalid ObjectId with 400 without crashing
  ✔ GET /api/interview/report/:id - returns 404 for non-existent report
  ✔ User Isolation: User B cannot access User A's interview report
✔ Interview API Integration Tests (1.9s)

ℹ tests 13 | suites 2 | pass 13 | fail 0
```

### Frontend Verification:
```bash
cd client
npm run lint    # 0 errors, 0 warnings (Clean ESLint)
npm run build   # Production Vite bundle compiled in <500ms
```

---

## 📡 REST API Reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new candidate account |
| `POST` | `/api/auth/login` | Public | Sign in and receive HTTP-only session cookie |
| `POST` | `/api/auth/logout` | Authenticated | Invalidate session & blacklist token |
| `GET` | `/api/auth/get-me` | Authenticated | Retrieve current user profile |
| `GET` | `/api/health` | Public | System status, database & AI config check |
| `POST` | `/api/interview` | Authenticated | Upload resume PDF & generate AI report |
| `GET` | `/api/interview` | Authenticated | List previous interview reports for user |
| `GET` | `/api/interview/report/:id` | Authenticated | Fetch full interview report by ID |
| `POST` | `/api/interview/resume-pdf/:id`| Authenticated | Download tailored ATS resume PDF |
