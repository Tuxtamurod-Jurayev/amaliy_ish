import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthSession, LanguageCode } from "@/types/domain";

type ThemeMode = "light" | "dark";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone?: "success" | "error" | "info";
}

interface AppState {
  session: AuthSession | null;
  theme: ThemeMode;
  language: LanguageCode;
  toasts: ToastItem[];
  login: (session: AuthSession) => void;
  logout: () => void;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: LanguageCode) => void;
  pushToast: (toast: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      session: null,
      theme: "light",
      language: "uz",
      toasts: [],
      login: (session) => set({ session }),
      logout: () => set({ session: null }),
      setTheme: (theme) => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        set({ theme });
      },
      setLanguage: (language) => set({ language }),
      pushToast: (toast) =>
        set((state) => ({
          toasts: [
            ...state.toasts,
            { id: crypto.randomUUID(), tone: "info", ...toast },
          ],
        })),
      dismissToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        })),
    }),
    {
      name: "university-practical-app",
      partialize: (state) => ({
        session: state.session,
        theme: state.theme,
        language: state.language,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          document.documentElement.classList.toggle("dark", state.theme === "dark");
        }
      },
    },
  ),
);
