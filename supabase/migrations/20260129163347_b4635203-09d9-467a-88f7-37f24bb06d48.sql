-- Add new columns to profiles table for donor medical info and visibility
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_on_medication boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS medication_details text,
ADD COLUMN IF NOT EXISTS has_medical_condition boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS medical_condition_details text,
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'everyone' CHECK (visibility IN ('everyone', 'contacts_only')),
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS district text;

-- Add new columns to blood_requests for units and medical reports
ALTER TABLE public.blood_requests
ADD COLUMN IF NOT EXISTS units_required integer DEFAULT 1 CHECK (units_required >= 1 AND units_required <= 20),
ADD COLUMN IF NOT EXISTS medical_report_url text;

-- Create storage bucket for medical reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-reports', 'medical-reports', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: Users can upload their own medical reports
CREATE POLICY "Users can upload their own medical reports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'medical-reports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policy: Users can view their own medical reports
CREATE POLICY "Users can view their own medical reports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'medical-reports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policy: Donors can view reports for requests they're assigned to
CREATE POLICY "Donors can view reports for assigned requests"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'medical-reports' 
  AND EXISTS (
    SELECT 1 FROM blood_requests br
    JOIN profiles p ON p.id = br.donor_id
    WHERE p.user_id = auth.uid()
    AND br.medical_report_url LIKE '%' || name || '%'
  )
);

-- Create states table for location hierarchy
CREATE TABLE IF NOT EXISTS public.states (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

-- Create districts table
CREATE TABLE IF NOT EXISTS public.districts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  state_id uuid NOT NULL REFERENCES public.states(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(name, state_id)
);

-- Enable RLS
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

-- RLS policies for states and districts (public read)
CREATE POLICY "States are viewable by everyone" ON public.states FOR SELECT USING (true);
CREATE POLICY "Districts are viewable by everyone" ON public.districts FOR SELECT USING (true);

-- Insert Indian states
INSERT INTO public.states (name) VALUES
  ('Andhra Pradesh'), ('Arunachal Pradesh'), ('Assam'), ('Bihar'), ('Chhattisgarh'),
  ('Goa'), ('Gujarat'), ('Haryana'), ('Himachal Pradesh'), ('Jharkhand'),
  ('Karnataka'), ('Kerala'), ('Madhya Pradesh'), ('Maharashtra'), ('Manipur'),
  ('Meghalaya'), ('Mizoram'), ('Nagaland'), ('Odisha'), ('Punjab'),
  ('Rajasthan'), ('Sikkim'), ('Tamil Nadu'), ('Telangana'), ('Tripura'),
  ('Uttar Pradesh'), ('Uttarakhand'), ('West Bengal'), ('Delhi'), ('Jammu and Kashmir')
ON CONFLICT (name) DO NOTHING;