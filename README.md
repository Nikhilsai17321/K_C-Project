# Kisan-Credit Authentication & Role-Based Access Control

This document explains the authentication setup, Supabase migration details, FastAPI middleware dependencies, and how security limits are enforced.

---

## 1. Creating the First Admin User
To provision the very first **ADMIN** user on your Supabase cluster:

### Option A: Using the Supabase Dashboard SQL Editor (Recommended)
Once a user has signed up via your app, locate their `id` (UUID) from the **auth.users** table, then execute this SQL script to grant them the `ADMIN` role:

```sql
-- Update an existing user to have ADMIN privileges
UPDATE public.user_profiles
SET role = 'ADMIN'
WHERE email = 'admin@kisan-credit.org'; -- Replace with the user's registered email
```

### Option B: Automatic Default Seeding
During initial migrations or setup, you can seed a default admin profile. When this user registers via Supabase auth, the dynamic trigger will automatically hook up and assign their designated role:

```sql
-- Example configuration insert prior to signup (optional)
-- Or bypass trigger completely to seed initial admin record:
INSERT INTO public.user_profiles (id, email, full_name, role)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Secure UUID
    'system-admin@kisan-credit.org',
    'Head Underwriter Admin',
    'ADMIN'
);
```

---

## 2. Failed-Login Attempt Rate Limiting & Reset Mechanics
To protect rural lender profiles and underwriter credentials, the application enforces a strict **3 failed login attempts cap inside a rolling 24-hour window**.

### How it Works:
1. **Auditable Logging**: Every failed password or email attempt is recorded in the `public.login_attempts` table, detailing the target `email`, the timestamp `attempted_at`, and the boolean flag `success = FALSE`.
2. **Rolling Window Calculation**: When a user attempts to log in, the system counts the number of records with `success = FALSE` for that email where `attempted_at >= now() - INTERVAL '24 hours'`.
3. **Lockout Trigger**: If the count is **&ge; 3**, the system blocks any further authentication request and throws an HTTP 429 payload containing the remaining cooldown time.
4. **Cooperative Cooldown Reset**: 
   - **Automated**: The lockout naturally expires once individual records age past the 24-hour mark. If a user failed twice at 10:00 AM and once at 11:00 AM, they will be unblocked at 10:00 AM the following day (dropping below 3 active failures).
   - **Manual Reset**: To manually release a locked field-officer account, an Administrator can delete the failed attempt history logs for that user's email:
     ```sql
     -- Administrator Reset Override command:
     DELETE FROM public.login_attempts 
     WHERE email = 'field-officer@kisan-credit.org';
     ```

---

## 3. Row-Level Security Policies (RLS)
The included `supabase-migrations.sql` locks down the database tables (`applicants`, `transactions_ledger`, and `loans`) ensuring zero unauthenticated leakage:
- **Authenticated SELECT**: Only authorized users matching role `LENDER_OFFICER` or `ADMIN` can retrieve record sheets.
- **Admin-Only Modifiers**: Only `ADMIN` can update sensitive fields like borrower `trust_score` and `loan_status` through underwriter review portals.
- **Anonymous Block**: Public / anonymous access is fully restricted at the database engine level.
