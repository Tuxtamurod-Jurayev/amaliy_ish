import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "";
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "";

  return {
    plugins: [react()],
    define: {
      __APP_SUPABASE_URL__: JSON.stringify(supabaseUrl),
      __APP_SUPABASE_ANON_KEY__: JSON.stringify(supabaseAnonKey),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
