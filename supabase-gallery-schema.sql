-- Run this in your Supabase SQL Editor to create the gallery_images table

CREATE TABLE IF NOT EXISTS public.gallery_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read gallery images
DROP POLICY IF EXISTS "Anyone can read gallery images" ON public.gallery_images;
CREATE POLICY "Anyone can read gallery images" ON public.gallery_images
    FOR SELECT USING (true);

-- Insert some default placeholder images so the gallery isn't empty initially
INSERT INTO public.gallery_images (url) VALUES 
('https://picsum.photos/seed/djmc1/1200/600'),
('https://picsum.photos/seed/djmc2/1200/600'),
('https://picsum.photos/seed/djmc3/1200/600')
ON CONFLICT DO NOTHING;
