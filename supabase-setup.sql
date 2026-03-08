-- Run this entire script in your Supabase SQL Editor to set up the database and fix the RLS errors!

-- 1. Create the students table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    photo_url TEXT NOT NULL,
    district TEXT NOT NULL,
    hsc_batch TEXT NOT NULL,
    admission_roll TEXT UNIQUE NOT NULL,
    blood_group TEXT NOT NULL,
    college TEXT NOT NULL,
    whatsapp TEXT,
    facebook TEXT,
    is_approved BOOLEAN DEFAULT false NOT NULL
);

-- 2. Enable Row Level Security on the students table
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for the students table
-- Allow anyone to read approved students (for the homepage directory)
CREATE POLICY "Allow public read access on approved students" 
ON public.students FOR SELECT 
USING (is_approved = true);

-- Allow anyone to insert a new student (for the add profile page)
CREATE POLICY "Allow public insert on students" 
ON public.students FOR INSERT 
WITH CHECK (true);

-- Allow update for admin (we will bypass RLS in the API route using the service role key, or we can just allow it if we want, but service role key is better)
-- For now, we'll just use the service role key in the API route to bypass RLS for approvals.

-- 4. Set up the Storage Bucket for profile photos
-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 5. Create policies for the profiles storage bucket
-- Allow anyone to read the photos
CREATE POLICY "Allow public read access on profiles bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

-- Allow anyone to upload photos
CREATE POLICY "Allow public insert on profiles bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profiles');

-- Allow anyone to update their photos (if they upload with the same filename)
CREATE POLICY "Allow public update on profiles bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profiles');
