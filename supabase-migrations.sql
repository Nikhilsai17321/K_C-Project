-- Kisan-Credit Supabase Auth & RLS Migration Script
-- This script provisions the user_profiles and login_attempts tables, 
-- configures user roles, and sets up robust Row-Level Security (RLS) policies.

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------------------------------------
-- 1. Create PUBLIC.USER_PROFILES Table
--------------------------------------------------------------------------------
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'LENDER_OFFICER' CHECK (role IN ('LENDER_OFFICER', 'ADMIN')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Auto-provision user profile trigger on Supabase Auth Sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Field Officer'),
        COALESCE(new.raw_user_meta_data->>'role', 'LENDER_OFFICER')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--------------------------------------------------------------------------------
-- 2. Create LOGIN_ATTEMPTS Table
--------------------------------------------------------------------------------
CREATE TABLE public.login_attempts (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    success BOOLEAN NOT NULL,
    ip_address TEXT,
    user_agent TEXT
);

-- Enable RLS on login_attempts
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins should be able to view login attempts
CREATE POLICY admin_select_login_attempts ON public.login_attempts
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'ADMIN'
        )
    );


--------------------------------------------------------------------------------
-- 3. Row-Level Security (RLS) Policies on Core Tables
--------------------------------------------------------------------------------

-- Ensure target tables exist (Placeholder definitions matching our model)
CREATE TABLE IF NOT EXISTS public.applicants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    location TEXT NOT NULL,
    state TEXT NOT NULL,
    phone TEXT NOT NULL,
    secondary_phone TEXT,
    trust_score INT NOT NULL,
    income_monthly NUMERIC NOT NULL,
    expenses_monthly NUMERIC NOT NULL,
    registration_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING'
);

CREATE TABLE IF NOT EXISTS public.transactions_ledger (
    id TEXT PRIMARY KEY,
    applicant_id TEXT REFERENCES public.applicants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    type TEXT CHECK (type IN ('INCOME', 'EXPENSE')) NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    confidence_score NUMERIC NOT NULL,
    added_via TEXT NOT NULL,
    transcript_ref TEXT
);

CREATE TABLE IF NOT EXISTS public.loans (
    id TEXT PRIMARY KEY,
    applicant_id TEXT REFERENCES public.applicants(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    term_months INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'SUBMITTED',
    request_date DATE NOT NULL,
    decision_date DATE,
    interest_rate NUMERIC NOT NULL,
    monthly_repayment NUMERIC NOT NULL,
    risk_bucket TEXT NOT NULL
);

-- Enable RLS on Core Tables
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- Core Policy Helper Function: Check if User has Role
CREATE OR REPLACE FUNCTION public.user_has_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid() 
          AND user_profiles.role = ANY(required_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- A. RLS Policies for APPLICANTS Table
CREATE POLICY select_applicants ON public.applicants
    FOR SELECT TO authenticated 
    USING (public.user_has_role(ARRAY['LENDER_OFFICER', 'ADMIN']));

CREATE POLICY insert_applicants ON public.applicants
    FOR INSERT TO authenticated 
    WITH CHECK (public.user_has_role(ARRAY['LENDER_OFFICER', 'ADMIN']));

CREATE POLICY update_applicants_admin ON public.applicants
    FOR UPDATE TO authenticated 
    USING (public.user_has_role(ARRAY['ADMIN']));


-- B. RLS Policies for TRANSACTIONS_LEDGER Table
CREATE POLICY select_transactions ON public.transactions_ledger
    FOR SELECT TO authenticated 
    USING (public.user_has_role(ARRAY['LENDER_OFFICER', 'ADMIN']));

CREATE POLICY insert_transactions ON public.transactions_ledger
    FOR INSERT TO authenticated 
    WITH CHECK (public.user_has_role(ARRAY['LENDER_OFFICER', 'ADMIN']));

CREATE POLICY update_transactions_admin ON public.transactions_ledger
    FOR UPDATE TO authenticated 
    USING (public.user_has_role(ARRAY['ADMIN']));


-- C. RLS Policies for LOANS Table
CREATE POLICY select_loans ON public.loans
    FOR SELECT TO authenticated 
    USING (public.user_has_role(ARRAY['LENDER_OFFICER', 'ADMIN']));

CREATE POLICY insert_loans ON public.loans
    FOR INSERT TO authenticated 
    WITH CHECK (public.user_has_role(ARRAY['LENDER_OFFICER', 'ADMIN']));

CREATE POLICY update_loans_admin ON public.loans
    FOR UPDATE TO authenticated 
    USING (public.user_has_role(ARRAY['ADMIN']));
