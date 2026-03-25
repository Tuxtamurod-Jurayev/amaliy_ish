import { Outlet } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ToastViewport } from "@/components/ui/ToastViewport";

export function AuthLayout() {
  return (
    <div className="min-h-screen px-3 py-4 sm:px-4 sm:py-8">
      <div className="mx-auto flex max-w-5xl justify-end">
        <ThemeToggle />
      </div>
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl items-center">
        <Outlet />
      </div>
      <ToastViewport />
    </div>
  );
}
