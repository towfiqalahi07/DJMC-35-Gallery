-- Info Requests Table
CREATE TABLE IF NOT EXISTS public.info_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    fields JSONB NOT NULL, -- Array of objects: { id, label, type, target_column }
    is_published BOOLEAN DEFAULT false,
    is_open BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.info_requests ENABLE ROW LEVEL SECURITY;

-- Policies for info_requests
CREATE POLICY "Info requests are viewable by everyone." ON public.info_requests
    FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage info requests." ON public.info_requests
    FOR ALL USING (auth.role() = 'service_role');

-- Collected Info Table (Submissions)
CREATE TABLE IF NOT EXISTS public.collected_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID REFERENCES public.info_requests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Identity Metadata
    name TEXT,
    phone TEXT,
    email TEXT,
    admission_roll TEXT,
    class_roll TEXT,
    
    -- Dynamic Columns (Admins map fields to these)
    col_text_1 TEXT,
    col_text_2 TEXT,
    col_text_3 TEXT,
    col_text_4 TEXT,
    col_text_5 TEXT,
    col_num_1 NUMERIC,
    col_num_2 NUMERIC,
    col_date_1 DATE,
    col_img_1 TEXT,
    col_img_2 TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(request_id, user_id)
);

-- Enable RLS
ALTER TABLE public.collected_info ENABLE ROW LEVEL SECURITY;

-- Policies for collected_info
CREATE POLICY "Users can view their own submissions." ON public.collected_info
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own submissions." ON public.collected_info
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions." ON public.collected_info
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all submissions." ON public.collected_info
    FOR SELECT USING (auth.role() = 'service_role');
