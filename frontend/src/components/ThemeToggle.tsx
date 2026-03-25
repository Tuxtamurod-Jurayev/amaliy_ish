import { Moon, Sun } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function ThemeToggle() {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(isLight ? "dark" : "light")}
      className="button-secondary gap-2 px-3 py-2.5 sm:px-4"
      aria-label={isLight ? "Tun rejimini yoqish" : "Kun rejimini yoqish"}
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/10">
        {isLight ? <Moon size={16} /> : <Sun size={16} />}
      </span>
      <span className="hidden text-sm sm:inline">{isLight ? "Tun rejimi" : "Kun rejimi"}</span>
    </button>
  );
}
