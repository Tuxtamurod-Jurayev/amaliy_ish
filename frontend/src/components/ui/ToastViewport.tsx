import { useEffect } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";

const toneClass = {
  success: "border-emerald-200/90 bg-emerald-50/95 text-emerald-950 dark:border-emerald-900/90 dark:bg-emerald-950/80 dark:text-emerald-100",
  error: "border-rose-200/90 bg-rose-50/95 text-rose-950 dark:border-rose-900/90 dark:bg-rose-950/80 dark:text-rose-100",
  info: "",
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
    <div className="fixed inset-x-3 top-3 z-50 space-y-3 sm:left-auto sm:right-4 sm:top-4 sm:w-80">
      {toasts.map((toast) => {
        const tone = toast.tone ?? "info";
        const Icon = icons[tone];

        return (
          <div
            key={toast.id}
            className={cn(
              "rounded-3xl border px-4 py-3 shadow-soft backdrop-blur",
              toneClass[tone],
            )}
            style={
              tone === "info"
                ? {
                    borderColor: "var(--border)",
                    background: "color-mix(in srgb, var(--surface-strong) 92%, transparent)",
                    color: "var(--text)",
                  }
                : undefined
            }
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
