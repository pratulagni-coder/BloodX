-- Fix the overly permissive notification insert policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create more restrictive notification insert policy
-- Users can create notifications for other users (for blood request notifications)
CREATE POLICY "Authenticated users can create notifications" ON public.notifications 
  FOR INSERT TO authenticated 
  WITH CHECK (
    -- Allow creating notifications for blood requests where the creator is involved
    EXISTS (
      SELECT 1 FROM public.blood_requests br
      JOIN public.profiles p ON (br.patient_id = p.id OR br.donor_id = p.id)
      WHERE br.id = related_request_id AND p.user_id = auth.uid()
    )
    OR
    -- Allow creating notifications without a related request (for direct contact requests)
    related_request_id IS NULL
  );