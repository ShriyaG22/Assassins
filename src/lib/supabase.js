import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ptaaibhxcgvzqfbswbex.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0YWFpYmh4Y2d2enFmYnN3YmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNzAwODIsImV4cCI6MjA5MTY0NjA4Mn0.Q_jPIu98lDmH6TuCwhqxLbqewXfTwQM3aSJwhUwuIMw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } },
});
