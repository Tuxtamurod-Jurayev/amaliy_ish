import { Outlet } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ToastViewport } from "@/components/ui/ToastViewport";

export function AuthLayout() {
  return (
    <div className="min-h-screen px-4 py-5 sm:py-8">
      <div className="mx-auto flex max-w-5xl justify-end">
        <ThemeToggle />
      </div>
      <div className="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-5xl items-center">
        <Outlet />
      </div>
      <ToastViewport />
    </div>
  );
}
