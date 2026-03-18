-- Run this in your Supabase SQL Editor to update the students table schema

ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS facebook TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- If you want to make email required for future entries, you can run this AFTER ensuring all existing rows have an email:
-- ALTER TABLE public.students ALTER COLUMN email SET NOT NULL;
