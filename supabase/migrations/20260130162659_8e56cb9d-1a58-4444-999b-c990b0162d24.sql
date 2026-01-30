-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

-- Create a helper function to check if a user is in someone's contacts
CREATE OR REPLACE FUNCTION public.is_user_contact_of(profile_id uuid, checking_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_contacts uc
    JOIN profiles p ON uc.user_id = p.id
    WHERE uc.contact_user_id = profile_id
      AND p.user_id = checking_user_id
  )
$$;

-- Create a helper function to check if users are connected via blood request
CREATE OR REPLACE FUNCTION public.has_blood_request_connection(profile_id uuid, checking_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM blood_requests br
    JOIN profiles p_patient ON br.patient_id = p_patient.id
    JOIN profiles p_donor ON br.donor_id = p_donor.id
    WHERE (
      -- Checking user is patient and profile_id is donor
      (p_patient.user_id = checking_user_id AND br.donor_id = profile_id)
      OR
      -- Checking user is donor and profile_id is patient
      (p_donor.user_id = checking_user_id AND br.patient_id = profile_id)
    )
    AND br.status IN ('accepted', 'completed')
  )
$$;

-- Create a helper function to get the profile id for a user
CREATE OR REPLACE FUNCTION public.get_profile_id_for_user(user_uuid uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE user_id = user_uuid LIMIT 1
$$;

-- Create restrictive RLS policy for profiles
-- Users can see:
-- 1. Their own profile (full access)
-- 2. Donors with visibility='everyone' who are available (limited fields enforced in app)
-- 3. Donors with visibility='contacts_only' ONLY if they are in user's contacts
-- 4. Users connected via accepted/completed blood requests
CREATE POLICY "Profiles visible based on visibility and connections" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  -- Own profile - always visible
  user_id = auth.uid()
  OR
  -- Donors with 'everyone' visibility who are available
  (is_donor = true AND is_available = true AND (visibility = 'everyone' OR visibility IS NULL))
  OR
  -- Donors with 'contacts_only' visible only to their contacts
  (is_donor = true AND visibility = 'contacts_only' AND public.is_user_contact_of(id, auth.uid()))
  OR
  -- Users connected via accepted blood requests (for communication)
  public.has_blood_request_connection(id, auth.uid())
);

-- Keep existing INSERT policy (users can insert their own profile)
-- Keep existing UPDATE policy (users can update their own profile)