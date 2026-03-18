import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { appService } from "@/services/appService";

export function AdminDashboardPage() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof appService.getAdminStats>> | null>(null);

  useEffect(() => {
    let active = true;
    appService.getAdminStats().then((value) => {
      if (active) setStats(value);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Boshqaruv markazi"
        description="Teacherlar, fanlar va topshiriqlar bo'yicha umumiy ko'rinish."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats
          ? [
              { label: "Teachers", value: stats.teachers },
              { label: "Students", value: stats.students },
              { label: "Subjects", value: stats.subjects },
              { label: "Assignments", value: stats.assignments },
            ].map((item) => <StatCard key={item.label} label={item.label} value={item.value} />)
          : Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel">
          <h3 className="font-display text-2xl font-semibold">Tizim holati</h3>
          <div className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <p>Ma'lumotlar Supabase orqali saqlanadi.</p>
            <p>Teacher, student va assignment boshqaruvi real baza bilan ishlaydi.</p>
          </div>
        </div>

        <div className="panel">
          <h3 className="font-display text-2xl font-semibold">Boshqaruv</h3>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            Yangi teacherlar yarating, fan biriktiring va tizimni admin sifatida boshqaring.
          </p>
        </div>
      </div>
    </section>
  );
}
