-- Supabase Schema for Sistem Pengaduan Sekolah

-- Create Enum for Report Status
CREATE TYPE report_status AS ENUM ('Baru', 'Diperiksa', 'Ditindaklanjuti', 'Selesai');

-- 1. Create Reports Table
CREATE TABLE public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_number VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    reporter_name VARCHAR(100),
    reporter_class VARCHAR(50),
    is_anonymous BOOLEAN DEFAULT false,
    phone VARCHAR(20),
    evidence_url TEXT,
    status report_status DEFAULT 'Baru',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Users Table (for BK and Admin)
-- We'll link this to auth.users in a real production app, but for now we'll create a profile table
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'bk',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Report Notes Table (for BK to add internal notes)
CREATE TABLE public.report_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- Row Level Security (RLS) setup

-- Enable RLS on tables
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_notes ENABLE ROW LEVEL SECURITY;

-- Policies for Reports
-- Anyone (anon or authenticated) can insert a report
CREATE POLICY "Anyone can insert reports" 
ON public.reports FOR INSERT 
TO public 
WITH CHECK (true);

-- Anyone can read a report if they know the report_number (for checking status)
CREATE POLICY "Anyone can view their report by number" 
ON public.reports FOR SELECT 
TO public 
USING (true);

-- BK/Admins (authenticated users) can do everything on reports
CREATE POLICY "Authenticated users can manage reports" 
ON public.reports FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);


-- Policies for User Profiles
-- Authenticated users can view profiles
CREATE POLICY "Authenticated users can view profiles" 
ON public.user_profiles FOR SELECT 
TO authenticated 
USING (true);


-- Policies for Report Notes
-- Authenticated users can manage notes
CREATE POLICY "Authenticated users can manage notes" 
ON public.report_notes FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);


-- Storage Bucket for Evidence (Optional)
-- You'll need to create a bucket named 'evidence' in Supabase Storage dashboard manually
-- and set its policy to public read, authenticated insert.
