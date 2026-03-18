import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { appService } from "@/services/appService";
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
        <button type="submit" disabled={loading} className="button-primary w-full">
          {loading ? "Kirish..." : "Kirish"}
        </button>
      </form>
    </div>
  );
}
