-- Create enum for blood groups
CREATE TYPE public.blood_group AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');

-- Create enum for urgency levels
CREATE TYPE public.urgency_level AS ENUM ('normal', 'urgent', 'critical');

-- Create enum for request status
CREATE TYPE public.request_status AS ENUM ('pending', 'accepted', 'declined', 'completed');

-- Create areas table for approximate locations
CREATE TABLE public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL DEFAULT 'Hyderabad',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert sample areas
INSERT INTO public.areas (name, city) VALUES
  ('Kukatpally', 'Hyderabad'),
  ('JNTU', 'Hyderabad'),
  ('Hitech City', 'Hyderabad'),
  ('Gachibowli', 'Hyderabad'),
  ('Madhapur', 'Hyderabad'),
  ('Ameerpet', 'Hyderabad'),
  ('Secunderabad', 'Hyderabad'),
  ('Begumpet', 'Hyderabad'),
  ('Banjara Hills', 'Hyderabad'),
  ('Jubilee Hills', 'Hyderabad');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  blood_group blood_group NOT NULL,
  is_donor BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  area_id UUID REFERENCES public.areas(id),
  last_donation_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create blood requests table
CREATE TABLE public.blood_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  donor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  blood_group blood_group NOT NULL,
  urgency urgency_level DEFAULT 'normal',
  hospital_name TEXT,
  area_id UUID REFERENCES public.areas(id),
  status request_status DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create contacts/connections table for "My Network"
CREATE TABLE public.user_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  contact_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, contact_user_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'request',
  is_read BOOLEAN DEFAULT false,
  related_request_id UUID REFERENCES public.blood_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Areas are public read
CREATE POLICY "Areas are viewable by everyone" ON public.areas FOR SELECT USING (true);

-- Profiles policies
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles 
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Blood requests policies
CREATE POLICY "Requests are viewable by authenticated users" ON public.blood_requests 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create requests for their profile" ON public.blood_requests 
  FOR INSERT TO authenticated 
  WITH CHECK (patient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Request owners and donors can update" ON public.blood_requests 
  FOR UPDATE TO authenticated 
  USING (
    patient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    donor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- User contacts policies
CREATE POLICY "Users can view their contacts" ON public.user_contacts 
  FOR SELECT TO authenticated 
  USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can add contacts" ON public.user_contacts 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can remove their contacts" ON public.user_contacts 
  FOR DELETE TO authenticated 
  USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON public.notifications 
  FOR SELECT TO authenticated 
  USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their notifications" ON public.notifications 
  FOR UPDATE TO authenticated 
  USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "System can create notifications" ON public.notifications 
  FOR INSERT TO authenticated WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blood_requests_updated_at
  BEFORE UPDATE ON public.blood_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();