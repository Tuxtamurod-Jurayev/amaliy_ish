import { Link, NavLink } from "react-router-dom";
import { BookOpenCheck, ClipboardList, FolderOpenDot, GraduationCap, LayoutDashboard, LogOut, MonitorPlay, Users, type LucideIcon } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import type { MessageKey } from "@/i18n/messages";
import { useAppStore } from "@/store/useAppStore";
import type { UserRole } from "@/types/domain";
import { cn } from "@/utils/cn";

const navByRole: Record<UserRole, { to: string; labelKey: MessageKey; icon: LucideIcon }[]> = {
  admin: [
    { to: "/app/admin", labelKey: "common_dashboard", icon: LayoutDashboard },
    { to: "/app/admin/teachers", labelKey: "common_teachers", icon: Users },
    { to: "/app/admin/subjects", labelKey: "common_subjects", icon: BookOpenCheck },
    { to: "/app/admin/courses", labelKey: "common_courses", icon: MonitorPlay },
  ],
  teacher: [
    { to: "/app/teacher", labelKey: "common_dashboard", icon: LayoutDashboard },
    { to: "/app/teacher/students", labelKey: "common_students", icon: GraduationCap },
    { to: "/app/teacher/assignments", labelKey: "common_assignments", icon: ClipboardList },
    { to: "/app/teacher/submissions", labelKey: "common_submissions", icon: FolderOpenDot },
  ],
  student: [
    { to: "/app/student", labelKey: "common_dashboard", icon: LayoutDashboard },
    { to: "/app/student/assignments", labelKey: "common_assignments", icon: ClipboardList },
    { to: "/app/student/courses", labelKey: "common_courses", icon: MonitorPlay },
  ],
};

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const session = useAppStore((state) => state.session);
  const logout = useAppStore((state) => state.logout);
  const { t } = useI18n();

  if (!session) return null;

  const items = navByRole[session.user.role];

  return (
    <aside className={cn("panel flex h-full flex-col justify-between overflow-hidden p-4", className)}>
      <div className="space-y-6">
        <Link to="/" className="block rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <p className="font-display text-2xl font-semibold">{t("brand")}</p>
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
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80",
                  )
                }
              >
                <Icon size={18} />
                {t(item.labelKey)}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800">
          <p className="text-sm font-semibold">{session.user.name}</p>
          <p className="text-xs text-slate-500">{t(`role_${session.user.role}`)}</p>
        </div>
        <button type="button" onClick={() => { logout(); onNavigate?.(); }} className="button-secondary w-full gap-2">
          <LogOut size={16} />
          {t("common_logout")}
        </button>
      </div>
    </aside>
  );
}
