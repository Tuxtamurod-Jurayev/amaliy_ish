import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { useAppStore } from "@/store/useAppStore";
import { appService } from "@/services/appService";

export function TeacherDashboardPage() {
  const session = useAppStore((state) => state.session);
  const [dashboard, setDashboard] = useState<Awaited<ReturnType<typeof appService.getTeacherDashboard>> | null>(null);

  useEffect(() => {
    if (!session) return;
    let active = true;
    appService.getTeacherDashboard(session.user.id).then((value) => {
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
        eyebrow="Teacher"
        title="Dashboard"
        description="Studentlar, assignmentlar va topshirish holati bo'yicha umumiy ko'rinish."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total students" value={dashboard.totalStudents} />
        <StatCard label="Total assignments" value={dashboard.totalAssignments} />
        <StatCard label="Submitted" value={dashboard.submitted} />
        <StatCard label="Not submitted" value={dashboard.notSubmitted < 0 ? 0 : dashboard.notSubmitted} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel">
          <h3 className="font-display text-2xl font-semibold">Assignment progress</h3>
          <div className="mt-6 space-y-4">
            {dashboard.progress.length === 0 ? (
              <EmptyState title="Assignmentlar yo'q" description="Yangi topshiriq yarating va progress shu yerda ko'rinadi." />
            ) : (
              dashboard.progress.map((item) => {
                const percent = item.targetedCount === 0 ? 0 : (item.submittedCount / item.targetedCount) * 100;
                return (
                  <div key={item.assignment.id}>
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium">{item.assignment.title}</span>
                      <span className="text-slate-500">
                        {item.submittedCount} / {item.targetedCount}
                      </span>
                    </div>
                    <div className="mt-2 h-3 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-3 rounded-full bg-orange-500" style={{ width: `${Math.min(percent, 100)}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="panel">
          <h3 className="font-display text-2xl font-semibold">Subject statistics</h3>
          <div className="mt-6 space-y-4">
            {dashboard.subjectCards.map((subject) => (
              <div key={subject.id} className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{subject.name}</p>
                    <p className="text-xs text-slate-500">{subject.type}</p>
                  </div>
                  <div className="text-right text-sm text-slate-500">
                    <p>{subject.assignmentCount} tasks</p>
                    <p>{subject.submissionCount} submissions</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
