-- Run this in your Supabase SQL Editor to fix RLS policies for the students table

-- Enable RLS on students table (if not already enabled)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can read their own profile" ON public.students;
DROP POLICY IF EXISTS "Anyone can read approved profiles" ON public.students;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.students;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.students;

-- 1. Users can read their own profile (regardless of approval status)
CREATE POLICY "Users can read their own profile" ON public.students
    FOR SELECT USING (auth.uid() = user_id);

-- 2. Anyone (or authenticated users) can read approved profiles
CREATE POLICY "Anyone can read approved profiles" ON public.students
    FOR SELECT USING (is_approved = true);

-- 3. Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON public.students
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.students
    FOR UPDATE USING (auth.uid() = user_id);
