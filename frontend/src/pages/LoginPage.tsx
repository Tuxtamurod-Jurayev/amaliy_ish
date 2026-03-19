import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { appService } from "@/services/appService";
import { supabaseEnv } from "@/services/supabase/client";
import { useAppStore } from "@/store/useAppStore";

export function LoginPage() {
  const [loginValue, setLoginValue] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const login = useAppStore((state) => state.login);
  const pushToast = useAppStore((state) => state.pushToast);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setLoading(true);
      const session = await appService.login(loginValue, password);
      login(session);
      const destination =
        location.state?.from ??
        (session.user.role === "admin"
          ? "/app/admin"
          : session.user.role === "teacher"
            ? "/app/teacher"
            : "/app/student");
      navigate(destination, { replace: true });
      pushToast({ title: "Muvaffaqiyatli kirdingiz", tone: "success" });
    } catch (error) {
      pushToast({
        title: "Kirishda xatolik",
        description: error instanceof Error ? error.message : "Noma'lum xatolik",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel mx-auto w-full max-w-md">
      <h2 className="font-display text-3xl font-semibold sm:text-4xl">Tizimga kirish</h2>
      {!supabaseEnv.configured ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          Supabase ulanmagan. Vercel env variable'larida `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY`
          yoki `SUPABASE_URL` va `SUPABASE_ANON_KEY` ni kiriting.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Login</label>
          <input className="input" value={loginValue} onChange={(event) => setLoginValue(event.target.value)} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Parol</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <button type="submit" disabled={loading || !supabaseEnv.configured} className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? "Kirish..." : "Kirish"}
        </button>
      </form>
    </div>
  );
}
