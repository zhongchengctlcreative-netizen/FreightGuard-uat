
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
  
  return {
    url: import.meta.env.VITE_SUPABASE_URL || "",
    key: import.meta.env.VITE_SUPABASE_KEY || "",
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

export const supabase = createClient(finalUrl, finalKey);
