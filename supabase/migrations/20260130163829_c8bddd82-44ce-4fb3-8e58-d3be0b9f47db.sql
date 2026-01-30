-- ==============================================
-- FIX 1: Restrict blood_requests table access
-- ==============================================

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Requests are viewable by authenticated users" ON public.blood_requests;

-- Create helper function to check if user has matching blood group for a request
CREATE OR REPLACE FUNCTION public.is_matching_donor_for_request(request_id uuid, checking_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM blood_requests br
    JOIN profiles donor_profile ON donor_profile.user_id = checking_user_id
    WHERE br.id = request_id
      AND br.donor_id IS NULL
      AND br.status = 'pending'
      AND donor_profile.is_donor = true
      AND donor_profile.is_available = true
      AND donor_profile.blood_group = br.blood_group
  )
$$;

-- Create restrictive RLS policy for blood_requests
-- Users can see:
-- 1. Their own requests (as patient)
-- 2. Requests specifically assigned to them (as donor)
-- 3. Pending requests that match their blood group (for available donors to browse)
CREATE POLICY "Restricted blood request access" 
ON public.blood_requests 
FOR SELECT 
TO authenticated 
USING (
  -- Own request as patient
  patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR
  -- Assigned as donor
  donor_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR
  -- Matching blood group for pending requests (limited view for discovery)
  public.is_matching_donor_for_request(id, auth.uid())
);

-- ==============================================
-- FIX 2: Create a secure view for profiles that hides sensitive data
-- ==============================================

-- Create a view that exposes only non-sensitive profile data for public viewing
-- Sensitive fields (phone, medical details) are only visible to the owner, contacts, or connected users
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT 
  p.id,
  p.user_id,
  p.full_name,
  p.blood_group,
  p.is_donor,
  p.is_available,
  p.area_id,
  p.state,
  p.district,
  p.visibility,
  p.last_donation_date,
  p.created_at,
  p.updated_at,
  -- Expose sensitive data only to: owner, contacts, or connected via blood request
  CASE 
    WHEN p.user_id = auth.uid() THEN p.phone
    WHEN public.is_user_contact_of(p.id, auth.uid()) THEN p.phone
    WHEN public.has_blood_request_connection(p.id, auth.uid()) THEN p.phone
    ELSE NULL
  END as phone,
  CASE 
    WHEN p.user_id = auth.uid() THEN p.is_on_medication
    WHEN public.is_user_contact_of(p.id, auth.uid()) THEN p.is_on_medication
    WHEN public.has_blood_request_connection(p.id, auth.uid()) THEN p.is_on_medication
    ELSE NULL
  END as is_on_medication,
  CASE 
    WHEN p.user_id = auth.uid() THEN p.medication_details
    WHEN public.is_user_contact_of(p.id, auth.uid()) THEN p.medication_details
    WHEN public.has_blood_request_connection(p.id, auth.uid()) THEN p.medication_details
    ELSE NULL
  END as medication_details,
  CASE 
    WHEN p.user_id = auth.uid() THEN p.has_medical_condition
    WHEN public.is_user_contact_of(p.id, auth.uid()) THEN p.has_medical_condition
    WHEN public.has_blood_request_connection(p.id, auth.uid()) THEN p.has_medical_condition
    ELSE NULL
  END as has_medical_condition,
  CASE 
    WHEN p.user_id = auth.uid() THEN p.medical_condition_details
    WHEN public.is_user_contact_of(p.id, auth.uid()) THEN p.medical_condition_details
    WHEN public.has_blood_request_connection(p.id, auth.uid()) THEN p.medical_condition_details
    ELSE NULL
  END as medical_condition_details
FROM public.profiles p;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;

-- ==============================================
-- FIX 3: Rename medical_report_url to medical_report_path
-- We store the file path, not public URLs
-- ==============================================

ALTER TABLE public.blood_requests 
RENAME COLUMN medical_report_url TO medical_report_path;