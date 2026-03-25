import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { useI18n } from "@/hooks/useI18n";
import { appService } from "@/services/appService";
import { useAppStore } from "@/store/useAppStore";

export function StudentCoursesPage() {
  const session = useAppStore((state) => state.session);
  const { t } = useI18n();
  const [courses, setCourses] = useState<Awaited<ReturnType<typeof appService.getStudentCourses>>>([]);

  useEffect(() => {
    if (!session) return;
    let active = true;
    appService.getStudentCourses(session.user.id).then((items) => {
      if (active) setCourses(items);
    });
    return () => {
      active = false;
    };
  }, [session]);

  if (!session) return null;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Student / Courses"
        title={t("student_courses_title")}
        description={t("student_courses_description")}
      />

      {courses.length === 0 ? (
        <EmptyState title={t("admin_courses_empty")} description={t("admin_courses_empty_description")} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {courses.map((course) => (
            <article key={course.id} className="panel space-y-4">
              <div className="space-y-3">
                <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {t(`course_category_${course.category}`)}
                </span>
                <div>
                  <h3 className="text-xl font-semibold">{course.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{course.description}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-950">
                  <p className="text-slate-500">Lessons</p>
                  <p className="mt-1 text-lg font-semibold">{course.totalLessons}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-950">
                  <p className="text-slate-500">Video done</p>
                  <p className="mt-1 text-lg font-semibold">{course.completedLessons}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-950">
                  <p className="text-slate-500">Assignments</p>
                  <p className="mt-1 text-lg font-semibold">{course.completedAssignments}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  {course.totalDurationMinutes} min • {course.nextLesson?.title ?? t("course_player_status_completed")}
                </p>
                <Link to={`/app/student/courses/${course.id}`} className="button-primary gap-2">
                  {course.nextLesson ? t("student_courses_continue") : t("student_courses_open")}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
