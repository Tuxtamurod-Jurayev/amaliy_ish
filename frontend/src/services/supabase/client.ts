import { createClient } from "@supabase/supabase-js";

const supabaseUrl = __APP_SUPABASE_URL__ || import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = __APP_SUPABASE_ANON_KEY__ || import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const fallbackUrl = "https://placeholder.supabase.co";
const fallbackAnonKey = "placeholder-anon-key";

export const supabaseEnv = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  configured: Boolean(supabaseUrl && supabaseAnonKey),
};

if (!supabaseEnv.configured) {
  console.warn("Supabase environment variables are missing.");
}

export const supabase = createClient(supabaseUrl || fallbackUrl, supabaseAnonKey || fallbackAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
