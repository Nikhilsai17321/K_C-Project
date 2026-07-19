# Kisan-Credit: Micro-Lending Platform Documentation

Welcome to the complete documentation for the **Kisan-Credit** system. This document details the application architecture, user interfaces, database schema, role-based authorization design, validation mechanics, and development presets.

---

## 🚀 1. Executive Summary

**Kisan-Credit** is a full-stack micro-lending and alternative credit-scoring platform designed for rural farmer-entrepreneurs and agricultural credit cooperatives. It bridges the gap between traditional banking institutions and rural borrowers by combining **WhatsApp-based intake** with an **automated underwriting engine** and a **lender/field-officer risk dashboard**.

### Core Value Proposition:
- **Zero-Barrier Conversational Intake**: Farmers apply for loans and log income/expense records entirely through a WhatsApp-based chat simulation.
- **Alternative Trust Scoring**: Evaluates creditworthiness using alternative datasets (milking yield logs, harvest records, agricultural SHG references, peer endorsements).
- **Secure Underwriting Operations**: Provides an internal, authenticated, role-based dashboard for lender officers and underwriters to verify ledger transactions, finalize loans, and disburse capital safely.

---

## 🛠️ 2. Architectural Blueprint

The application follows a modular, decoupled full-stack architecture designed to easily connect to a robust Supabase / PostgreSQL backend and high-performance FastAPI microservices.

```
                  ┌──────────────────────────────────────────────┐
                  │                 React App                    │
                  │   (Landing Page, WhatsApp Sim, Dashboard)    │
                  └──────┬────────────────────────────────┬──────┘
                         │                                │
        1. Chat Data &   │                                │ 2. Secure Auth
        Alternative Logs │                                │    & Underwriting
                         ▼                                ▼
              ┌──────────────────────┐        ┌──────────────────────┐
              │   WhatsApp Simulator │        │  Dashboard Interface │
              │   Conversational AI  │        │   (Lender Gateway)   │
              └──────────┬───────────┘        └───────────┬──────────┘
                         │                                │
                         ▼                                ▼
              ┌──────────────────────┐        ┌──────────────────────┐
              │  FastAPI Services    │◄───────┤    Supabase Auth     │
              │  & Tortoise ORM Engine│        │ (Role-based Profiles)│
              └──────────────────────┘        └──────────────────────┘
```

### Stack Components:
1. **Frontend UI**: Built using React 18 with TypeScript, styled natively with Tailwind CSS utilities, powered by Recharts for data visualization, and animated smoothly using Motion.
2. **Mock Server Engine**: A full-featured custom Express server (`server.ts`) implementing database queries, session management, secure credential storage, and rate-limiting rules.
3. **Supabase Schema**: A production-ready SQL migration set defining profile tables, triggers, and Row-Level Security (RLS) policies.
4. **FastAPI Auth Core**: Python code (`fastapi_auth.py`) validating Supabase JWT signatures, decoding roles, and enforcing server-side attempt limits.

---

## 👥 3. User Roles & Authentication Gate

Security and auditability are core pillars of Kisan-Credit. The internal dashboard restricts actions through a secure authentication gateway (`AuthPage.tsx`).

### Core Roles:
- **LENDER_OFFICER**: Field officers working directly with agricultural cooperatives. They have read-only access to records, view trust-score matrices, and trigger cooperative-based loan verification loops. They *cannot* modify sensitive scores, reject loans, or authorize capital disbursements.
- **ADMIN**: Senior underwriters and system administrators. They have full access to modify parameters, verify transactions, flag fraudulent behaviors, reject applications, and approve capital disbursements.

### Form Validation Safeguards:
The login and registration forms implement reusable `<ValidationMessage />` components that trigger both on field blur and form submission:
1. **Password Rule**: Enforces a minimum length of **8 characters**.
2. **Email Format Check**: Regex validation ensuring a valid cooperative domain structure.
3. **Empty Field Protection**: Prompts users to fill in empty email, password, or profile name fields instantly before transmitting.

### 🕒 Rolling Lockout Rate Limiter:
To prevent brute-force attacks on underwriter accounts, the login endpoint tracks and caps failed attempts:
- **Attempt Limit**: Maximum of **3 failed attempts** per unique email address.
- **Rolling Window**: **24-hour rolling cooldown**.
- **Lockout Screen**: An interactive modal is rendered displaying a live countdown of the remaining time until retry.
- **Developer Reset Bypass**: Includes an on-demand "Bypass / Reset Lockout" tool in the UI, allowing engineers to clear attempt tables for testing.

---

## 💾 4. Database Schema & RLS Migrations (`supabase-migrations.sql`)

The database configuration enforces secure, isolated data tables in PostgreSQL.

### Tables Configured:
1. **`user_profiles`**: Tracks internal dashboard users, linked 1:1 via foreign key to Supabase `auth.users`.
2. **`login_attempts`**: Records login failures securely, capturing `email`, `attempted_at`, and `success` status for lockout calculations.
3. **`applicants`**: Farmer profiles containing basic PII, business sector, monthly income, monthly expenses, and alternative credit scores.
4. **`loans`**: Loan files requested, detailing active terms, amount, target interest rates, monthly repayment plans, and current underwriting stage (`SUBMITTED`, `APPROVED`, `REJECTED`, `REQUESTED_MORE`).
5. **`transactions_ledger`**: Ledger records of incoming revenue and outgoing expenses.

### Key Row-Level Security (RLS) Policies:
- **`select_applicants` / `select_loans` / `select_transactions`**: Only authenticated users with a role of `LENDER_OFFICER` or `ADMIN` can retrieve record sheets.
- **`update_applicants_admin` / `update_loans_admin` / `update_transactions_admin`**: Only authenticated users with the `ADMIN` role are permitted to run updates or write final loan approvals.
- **Anonymous block**: Anonymous and public access is entirely prohibited across all primary transactional tables.

---

## 📝 5. Developer Guide & Presets

### Project Presets (Quick Access Accounts):
For demonstration and local development, the platform includes pre-seeded authentication profiles:
- **Lender Field Officer Profile**:
  - **Email**: `officer@kisan-credit.org`
  - **Password**: `Password123!`
  - **Permissions**: Read-only queue, transaction auditing, view applicant scorecards.
- **Senior Underwriter Admin Profile**:
  - **Email**: `admin@kisan-credit.org`
  - **Password**: `Password123!`
  - **Permissions**: Full write access, verify records, flag ledger items, approve/disburse loans.

### Running & Deploying:
1. Run `npm install` to load packages.
2. Launch the local dev environment via `npm run dev`.
3. Build for production using `npm run build` which produces static files in `/dist` and compiles server bundles to `/dist/server.cjs`.
