
import { createClient } from '@supabase/supabase-js';

// --- CONNECTION CONFIGURATION ---

// Get configuration from localStorage (runtime override) or environment variables.
const getSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    const storedUrl = localStorage.getItem('fg_supabase_url');
    const storedKey = localStorage.getItem('fg_supabase_key');
    if (storedUrl && storedKey) {
      return { url: storedUrl, key: storedKey, source: 'localStorage' };
    }
  }
  
  // Check multiple possible environment variable names
  const url = import.meta.env.VITE_SUPABASE_URL || (process.env as any).SUPABASE_URL || "";
  const key = import.meta.env.VITE_SUPABASE_KEY || (process.env as any).SUPABASE_KEY || "";
  
  return {
    url: url.trim(),
    key: key.trim(),
    source: 'environment'
  };
};

const { url: finalUrl, key: finalKey, source } = getSupabaseConfig();

// Validation helper
export const isSupabaseConfigured = !!(
  finalUrl && 
  finalKey && 
  finalUrl.startsWith('http') && 
  finalKey.length > 20
);

if (!isSupabaseConfigured) {
  if (typeof window !== 'undefined') {
    console.warn("Supabase configuration is missing or invalid. Please check your environment variables or system settings.");
  }
} else {
  if (typeof window !== 'undefined') {
    console.log(`Supabase connection initialized via ${source}.`);
  }
}

// Create client only if configured to avoid crashing the app on startup
// If not configured, we export a proxy or a dummy to prevent "undefined" errors
export const supabase = isSupabaseConfigured 
  ? createClient(finalUrl, finalKey)
  : createClient("https://placeholder.supabase.co", "placeholder-key"); // Dummy client to prevent crashes
