-- Run this script in your Supabase SQL Editor to add the new columns

-- Add 'author' column to resources table
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS author TEXT;

-- Add 'is_pinned' column to announcements table
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
