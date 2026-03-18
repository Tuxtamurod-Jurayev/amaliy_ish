import { useEffect } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";

const toneClass = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-100",
  error: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/70 dark:text-rose-100",
  info: "border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100",
};

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function ToastViewport() {
  const toasts = useAppStore((state) => state.toasts);
  const dismissToast = useAppStore((state) => state.dismissToast);

  useEffect(() => {
    const timers = toasts.map((toast) =>
      window.setTimeout(() => dismissToast(toast.id), 3200),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [dismissToast, toasts]);

  return (
    <div className="fixed right-4 top-4 z-50 space-y-3">
      {toasts.map((toast) => {
        const tone = toast.tone ?? "info";
        const Icon = icons[tone];

        return (
          <div
            key={toast.id}
            className={cn(
              "w-80 rounded-2xl border px-4 py-3 shadow-soft backdrop-blur",
              toneClass[tone],
            )}
          >
            <div className="flex gap-3">
              <Icon className="mt-0.5 shrink-0" size={18} />
              <div className="space-y-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? (
                  <p className="text-xs opacity-80">{toast.description}</p>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
