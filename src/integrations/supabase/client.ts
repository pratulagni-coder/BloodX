import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://emudrjcdduopqwvrunud.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtdWRyamNkZHVvcHF3dnJ1bnVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMDE1OTUsImV4cCI6MjA4NDY3NzU5NX0.CzZbiCo8ntC_8LfUblOquMmeVTItKQNt_O4jNLRqCi0";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
