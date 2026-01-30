-- Update profiles RLS policy to allow donors to see patient profiles for assigned requests
-- This enables donors to view patient details for pending blood requests

DROP POLICY IF EXISTS "Profiles visible based on visibility and connections" ON public.profiles;

CREATE POLICY "Profiles visible based on visibility and connections" ON public.profiles
FOR SELECT USING (
  -- User can always see their own profile
  (user_id = auth.uid()) 
  OR 
  -- Donors with visibility = everyone (or null) who are available
  ((is_donor = true) AND (is_available = true) AND ((visibility = 'everyone'::text) OR (visibility IS NULL)))
  OR 
  -- Donors with visibility = contacts_only who are in user's contacts
  ((is_donor = true) AND (visibility = 'contacts_only'::text) AND is_user_contact_of(id, auth.uid()))
  OR 
  -- Any profile connected through an accepted/pending blood request (patients AND donors)
  has_blood_request_connection(id, auth.uid())
);