import { Link, NavLink } from "react-router-dom";
import { BookOpenCheck, ClipboardList, FolderOpenDot, GraduationCap, LayoutDashboard, LogOut, Users, type LucideIcon } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { UserRole } from "@/types/domain";
import { cn } from "@/utils/cn";

const navByRole: Record<UserRole, { to: string; label: string; icon: LucideIcon }[]> = {
  admin: [
    { to: "/app/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/app/admin/teachers", label: "Teachers", icon: Users },
    { to: "/app/admin/subjects", label: "Subjects", icon: BookOpenCheck },
  ],
  teacher: [
    { to: "/app/teacher", label: "Dashboard", icon: LayoutDashboard },
    { to: "/app/teacher/students", label: "Students", icon: GraduationCap },
    { to: "/app/teacher/assignments", label: "Assignments", icon: ClipboardList },
    { to: "/app/teacher/submissions", label: "Submissions", icon: FolderOpenDot },
  ],
  student: [
    { to: "/app/student", label: "Dashboard", icon: LayoutDashboard },
    { to: "/app/student/assignments", label: "Assignments", icon: ClipboardList },
  ],
};

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const session = useAppStore((state) => state.session);
  const logout = useAppStore((state) => state.logout);

  if (!session) return null;

  const items = navByRole[session.user.role];

  return (
    <aside className={cn("panel flex h-full flex-col justify-between overflow-hidden p-4", className)}>
      <div className="space-y-6">
        <Link to="/" className="block rounded-3xl border p-4" style={{ borderColor: "var(--border)" }}>
          <p className="font-display text-2xl font-semibold">Oraliq Hub</p>
          <p className="mt-1 text-xs muted-copy">University practical workspace</p>
        </Link>

        <nav className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                end={item.to === "/app/admin" || item.to === "/app/teacher" || item.to === "/app/student"}
                className={({ isActive }) =>
                  cn(
                    "nav-item",
                    isActive && "nav-item-active",
                  )
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm font-semibold">{session.user.name}</p>
          <p className="text-xs muted-copy">{session.user.role}</p>
        </div>
        <button type="button" onClick={() => { logout(); onNavigate?.(); }} className="button-secondary w-full gap-2">
          <LogOut size={16} />
          Chiqish
        </button>
      </div>
    </aside>
  );
}
