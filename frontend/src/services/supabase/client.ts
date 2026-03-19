import { createClient } from "@supabase/supabase-js";

const defaultSupabaseUrl = "https://lsovaeimgwowominpfji.supabase.co";
const defaultSupabaseAnonKey = "sb_publishable_A3Fq7DCCSBgTsvY5D1XvDw_bTrVaA6N";

const supabaseUrl =
  __APP_SUPABASE_URL__ || import.meta.env.VITE_SUPABASE_URL || defaultSupabaseUrl;
const supabaseAnonKey =
  __APP_SUPABASE_ANON_KEY__ || import.meta.env.VITE_SUPABASE_ANON_KEY || defaultSupabaseAnonKey;

export const supabaseEnv = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  configured: Boolean(supabaseUrl && supabaseAnonKey),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
