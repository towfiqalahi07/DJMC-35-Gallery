-- Run this in your Supabase SQL Editor to create the tables for the Polls feature

CREATE TABLE IF NOT EXISTS public.polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    options JSONB NOT NULL, -- Array of objects: [{ id: '1', text: 'Option 1' }, { id: '2', text: 'Option 2' }]
    is_published BOOLEAN DEFAULT false,
    is_open BOOLEAN DEFAULT true,
    show_results BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    option_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(poll_id, user_id)
);

-- Enable RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Policies for polls
-- Anyone can read published polls
CREATE POLICY "Anyone can read published polls" ON public.polls
    FOR SELECT USING (is_published = true);

-- Admins can do everything (we'll use service role for admin API, so this is just for client if needed, but we'll use service role key in API routes)
-- So we don't strictly need admin policies if we use the service role key in Next.js API routes.

-- Policies for votes
-- Users can read their own votes
CREATE POLICY "Users can read their own votes" ON public.votes
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own votes
CREATE POLICY "Users can insert their own votes" ON public.votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes
CREATE POLICY "Users can update their own votes" ON public.votes
    FOR UPDATE USING (auth.uid() = user_id);

-- Everyone can read all votes to see results (if you want results to be public)
-- Or we can restrict it so only authenticated users can see results of published polls
CREATE POLICY "Authenticated users can read all votes" ON public.votes
    FOR SELECT TO authenticated USING (true);
