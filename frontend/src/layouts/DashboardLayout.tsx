import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ToastViewport } from "@/components/ui/ToastViewport";

export function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white p-3 sm:p-4 dark:bg-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl gap-4 lg:min-h-[calc(100vh-2rem)] lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar className="hidden lg:flex" />
        <div className="space-y-4">
          <div className="panel flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="button-secondary p-3 lg:hidden"
            >
              <Menu size={18} />
            </button>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>
          <main className="space-y-6">
            <Outlet />
          </main>
        </div>
      </div>
      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden">
          <div className="absolute inset-y-0 left-0 w-[86vw] max-w-sm p-3">
            <Sidebar
              className="h-full"
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/90 p-3 text-slate-900 dark:bg-slate-900 dark:text-slate-100"
          >
            <X size={18} />
          </button>
        </div>
      ) : null}
      <ToastViewport />
    </div>
  );
}
