import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { UserRole } from "@/types/domain";
import { useAppStore } from "@/store/useAppStore";

interface ProtectedRouteProps {
  allow?: UserRole[];
  children?: ReactNode;
}

export function ProtectedRoute({ allow, children }: ProtectedRouteProps) {
  const session = useAppStore((state) => state.session);
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allow && !allow.includes(session.user.role)) {
    const redirectMap: Record<UserRole, string> = {
      admin: "/app/admin",
      teacher: "/app/teacher",
      student: "/app/student",
    };
    return <Navigate to={redirectMap[session.user.role]} replace />;
  }

  if (children) return <>{children}</>;
  return <Outlet />;
}
