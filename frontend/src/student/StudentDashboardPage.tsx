import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { useAppStore } from "@/store/useAppStore";
import { appService } from "@/services/appService";
import { formatDate, relativeDeadline } from "@/utils/format";

export function StudentDashboardPage() {
  const session = useAppStore((state) => state.session);
  const [dashboard, setDashboard] = useState<Awaited<ReturnType<typeof appService.getStudentDashboard>> | null>(null);

  useEffect(() => {
    if (!session) return;
    let active = true;
    appService.getStudentDashboard(session.user.id).then((value) => {
      if (active) setDashboard(value);
    });
    return () => {
      active = false;
    };
  }, [session]);

  if (!dashboard) {
    return (
      <section className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Student"
        title={`Xush kelibsiz, ${dashboard.student.account.name}`}
        description="Fanlar, deadline va topshirish statuslari shu yerda ko'rinadi."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Assignments" value={dashboard.stats.total} />
        <StatCard label="Submitted" value={dashboard.stats.submitted} />
        <StatCard label="Accepted" value={dashboard.stats.accepted} />
        <StatCard label="Pending" value={dashboard.stats.pending} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="panel">
          <h3 className="font-display text-2xl font-semibold">Fanlar</h3>
          <div className="mt-5 flex flex-wrap gap-3">
            {dashboard.subjects.map((subject) => (
              <span key={subject.id} className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {subject.name}
              </span>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3 className="font-display text-2xl font-semibold">Yaqin deadline</h3>
          <div className="mt-5 space-y-3">
            {dashboard.assignments.slice(0, 4).map((assignment) => (
              <div key={assignment.id} className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{assignment.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{assignment.subject.name}</p>
                  </div>
                  <span className="text-xs text-slate-500">{relativeDeadline(assignment.deadline)}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{formatDate(assignment.deadline)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
