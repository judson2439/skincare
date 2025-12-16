import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://emqiscdnvmjjrqapccib.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtcWlzY2Rudm1qanJxYXBjY2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNDM1MjQsImV4cCI6MjA2NzkxOTUyNH0.EhPcX3k9V45sgMUdN8o-wvk2FjUCvRdsQrGup3y7GtI';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Automatically store session in localStorage
    persistSession: true,
    // Storage key for the session
    storageKey: 'supabase-auth-token',
    // Use localStorage for session storage
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Automatically refresh the token before it expires
    autoRefreshToken: true,
    // Detect session from URL (for OAuth redirects)
    detectSessionInUrl: true,
    // Flow type for PKCE
    flowType: 'pkce',
  },
  global: {
    // Custom headers for all requests
    headers: {
      'X-Client-Info': 'skincare-app',
    },
  },
  db: {
    // Default schema
    schema: 'public',
  },
  realtime: {
    // Realtime configuration
    params: {
      eventsPerSecond: 10,
    },
  },
});


export { supabase };
