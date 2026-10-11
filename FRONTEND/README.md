# Bhoomi Registry — Land Registration & Property Management System

A production-ready React + Vite application for the Bhoomi Land Registration and Cadastral Property Management System, powered by an Express & MongoDB backend with real Google OAuth 2.0, cryptographically signed JWT sessions, and Auto Role Detection.

## Architecture & Authentication

- **Google OAuth 2.0:** Secure identity verification via `google-auth-library`. Verifies user profile, saves Google ID (`sub`), verified email, and maps user to their database-stored role.
- **Signed JWT Sessions:** Tokens signed via `jsonwebtoken` and verified by backend `protect` and `authorize` middlewares on all official endpoints.
- **Auto Role Detection:** Users sign in once with Google or verified credentials; the system fetches their real role from MongoDB (`citizen`, `officer`/`registrar`, `surveyor`, `lawyer`, `admin`) and automatically routes them to the correct role dashboard.
- **Security & Privilege Control:** Self-registration is strictly restricted to citizen role. Privileged assignments (Admin, Registrar, Surveyor, Lawyer) can only be granted by verified Administrators.
- **Real Data & Clean Database:** All mock users and sample data have been eliminated. Pages display real database records with graceful empty states.

## Getting Started

### 1. Backend Server

```bash
cd backend
npm install
npm run dev
```

Runs on `http://localhost:5000`.

### 2. Frontend Client

```bash
cd FRONTEND
npm install
npm run dev
```

Runs on `http://localhost:5173`.

### 3. Production Build

```bash
npm run build
npm run preview
```

## Running Automated E2E Auth Tests

From the `backend` directory:

```bash
node test_e2e_auth.js
```

Runs 19 automated tests verifying:
1. Google OAuth URL generation
2. Registration and duplicate email prevention
3. Privileged role escalation prevention
4. Login with bcrypt password verification
5. Official Administrator login
6. Role persistence for users (e.g. `24104022@nec.edu.in`)
7. JWT validation, tampered token rejection, and expired token rejection
8. RBAC and permission isolation across routes
9. Clean database validation (0 mock accounts)
