-- ============================================================
-- GyanCode Platform - Complete Database Setup
-- ============================================================
-- Run this in your Supabase SQL Editor (supabase.com > SQL Editor)
-- This script is IDEMPOTENT — safe to re-run after dropping everything.
-- ============================================================

-- ========== STEP 1: CLEAN SLATE (drop existing objects) ==========

DROP FUNCTION IF EXISTS public.increment_points(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.is_educator() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- Policies are dropped automatically when their tables are dropped CASCADE.
-- We skip explicit DROP POLICY to avoid "relation does not exist" errors on fresh DBs.

DROP TABLE IF EXISTS public.submission_comments CASCADE;
DROP TABLE IF EXISTS public.test_cases CASCADE;
DROP TABLE IF EXISTS public.bookmarks CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.certificates CASCADE;
DROP TABLE IF EXISTS public.submissions CASCADE;
DROP TABLE IF EXISTS public.assignments CASCADE;
DROP TABLE IF EXISTS public.platform_settings CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ========== STEP 2: CREATE TABLES ==========

-- Users table (linked to Supabase Auth)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('Student', 'Educator', 'Admin')) NOT NULL,
    academic_year TEXT,
    total_points INTEGER DEFAULT 0,
    department TEXT,
    certificate_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Assignments table
CREATE TABLE public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    language TEXT NOT NULL,
    proficiency_level TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    expected_input TEXT,
    expected_output TEXT NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE,
    category TEXT,
    starter_code TEXT,
    is_published BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Submissions table
CREATE TABLE public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    code TEXT NOT NULL,
    status TEXT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    language TEXT NOT NULL,
    last_hint TEXT
);

-- Certificates table
CREATE TABLE public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    awarded_to UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    category TEXT,
    description TEXT,
    skills TEXT,
    issued_by UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Nullable for system-issued
    storage_url TEXT DEFAULT '',
    issued_on DATE DEFAULT CURRENT_DATE NOT NULL
);

-- Platform Settings table
CREATE TABLE public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Announcements table
CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bookmarks table
CREATE TABLE public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, assignment_id)
);

-- Test Cases table
CREATE TABLE public.test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
    input TEXT,
    output TEXT NOT NULL,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Submission Comments table
CREATE TABLE public.submission_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========== STEP 3: HELPER FUNCTIONS (must be defined before RLS) ==========

-- Function to increment user points (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.increment_points(user_id UUID, points_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.users
    SET total_points = total_points + points_to_add
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is an educator (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_educator()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'Educator'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is an admin (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'Admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== STEP 4: ENABLE ROW LEVEL SECURITY ==========

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- ========== STEP 5: RLS POLICIES ==========

-- ---- UNIVERSAL ADMIN ACCESS ----
-- Admins are granted full unhindered mapping across all tables.
CREATE POLICY "Admins can manage all users" ON public.users FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage all assignments" ON public.assignments FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage all submissions" ON public.submissions FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage all certificates" ON public.certificates FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage all announcements" ON public.announcements FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage all bookmarks" ON public.bookmarks FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage all test cases" ON public.test_cases FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage all comments" ON public.submission_comments FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage all settings" ON public.platform_settings FOR ALL USING (public.is_admin());

-- ---- PLATFORM SETTINGS ----
-- Publicly readable by all authenticated users for frontend enforcement
CREATE POLICY "Anyone can view settings" ON public.platform_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- ---- USERS ----
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Educators can view all user profiles (for dashboards)
CREATE POLICY "Educators can view all student profiles" ON public.users
    FOR SELECT USING (public.is_educator());

-- Users can insert their own profile row during registration
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- ---- ASSIGNMENTS ----
-- Any authenticated user can view assignments
CREATE POLICY "Anyone can view assignments" ON public.assignments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only educators can create assignments
CREATE POLICY "Educators can create assignments" ON public.assignments
    FOR INSERT WITH CHECK (public.is_educator());

-- ---- SUBMISSIONS ----
-- Students can view and create their own submissions
CREATE POLICY "Students can handle own submissions" ON public.submissions
    FOR ALL USING (auth.uid() = user_id);

-- Educators can view all submissions
CREATE POLICY "Educators can view all submissions" ON public.submissions
    FOR SELECT USING (public.is_educator());

-- ---- CERTIFICATES ----
-- Students can view their own certificates
CREATE POLICY "Students can view own certificates" ON public.certificates
    FOR SELECT USING (auth.uid() = awarded_to);

-- Educators can create certificates
CREATE POLICY "Educators can manage certificates" ON public.certificates
    FOR INSERT WITH CHECK (public.is_educator());

-- ---- ANNOUNCEMENTS ----
-- All logged-in users (students & educators) can read announcements
CREATE POLICY "Authenticated users can view announcements" ON public.announcements
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only educators can post announcements
CREATE POLICY "Educators can create announcements" ON public.announcements
    FOR INSERT WITH CHECK (public.is_educator());

-- Educators can delete their own announcements
CREATE POLICY "Educators can delete own announcements" ON public.announcements
    FOR DELETE USING (
        auth.uid() = created_by AND public.is_educator()
    );

-- ---- BOOKMARKS ----
CREATE POLICY "Students can manage own bookmarks" ON public.bookmarks
    FOR ALL USING (auth.uid() = user_id);

-- ---- TEST CASES ----
CREATE POLICY "Anyone can view public test cases" ON public.test_cases
    FOR SELECT USING (is_hidden = FALSE OR public.is_educator());

CREATE POLICY "Educators can manage test cases" ON public.test_cases
    FOR ALL USING (public.is_educator());

-- ---- SUBMISSION COMMENTS ----
CREATE POLICY "Anyone can view comments on accessible submissions" ON public.submission_comments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.submissions s WHERE s.id = submission_id AND (s.user_id = auth.uid() OR public.is_educator()))
    );

CREATE POLICY "Educators can create comments" ON public.submission_comments
    FOR INSERT WITH CHECK (public.is_educator());
