-- Update has_blood_request_connection function to include pending requests for assigned donors
-- This allows donors to see patient contact details for pending requests they've been assigned to

CREATE OR REPLACE FUNCTION public.has_blood_request_connection(profile_id uuid, checking_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM blood_requests br
    JOIN profiles p_patient ON br.patient_id = p_patient.id
    JOIN profiles p_donor ON br.donor_id = p_donor.id
    WHERE (
      -- Checking user is patient and profile_id is the assigned donor
      (p_patient.user_id = checking_user_id AND br.donor_id = profile_id)
      OR
      -- Checking user is the assigned donor and profile_id is patient
      (p_donor.user_id = checking_user_id AND br.patient_id = profile_id)
    )
    -- Include pending requests so donors can see patient details immediately
    AND br.status IN ('pending', 'accepted', 'completed')
  )
$function$;