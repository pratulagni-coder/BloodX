-- Enable realtime for blood_requests table for instant notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.blood_requests;

-- Enable realtime for notifications table as well
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;