import { FormEvent, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { useI18n } from "@/hooks/useI18n";
import { appService } from "@/services/appService";
import { useAppStore } from "@/store/useAppStore";
import type { CourseCategory, LessonAssignmentType, ProgrammingLanguage } from "@/types/domain";

type LessonForm = {
  title: string;
  summary: string;
  videoUrl: string;
  durationMinutes: number;
  assignmentType: LessonAssignmentType;
  assignmentPrompt: string;
  brokenCode: string;
  solutionCode: string;
  language: ProgrammingLanguage;
};

type CourseForm = {
  title: string;
  description: string;
  category: CourseCategory;
  coverImage: string;
  lessons: LessonForm[];
};

const initialLesson = (): LessonForm => ({
  title: "",
  summary: "",
  videoUrl: "",
  durationMinutes: 15,
  assignmentType: "image",
  assignmentPrompt: "",
  brokenCode: "",
  solutionCode: "",
  language: "javascript",
});

const initialForm = (): CourseForm => ({
  title: "",
  description: "",
  category: "mathematics",
  coverImage: "",
  lessons: [initialLesson()],
});

export function AdminCoursesPage() {
  const { t } = useI18n();
  const pushToast = useAppStore((state) => state.pushToast);
  const [courses, setCourses] = useState<Awaited<ReturnType<typeof appService.getAdminCourses>>>([]);
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CourseForm>(initialForm);

  useEffect(() => {
    let active = true;
    appService.getAdminCourses().then((items) => {
      if (active) setCourses(items);
    });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const totalDuration = useMemo(
    () => form.lessons.reduce((sum, lesson) => sum + Number(lesson.durationMinutes || 0), 0),
    [form.lessons],
  );

  function resetForm() {
    setOpen(false);
    setEditingId(null);
    setForm(initialForm());
  }

  function updateLesson(index: number, patch: Partial<LessonForm>) {
    setForm((current) => ({
      ...current,
      lessons: current.lessons.map((lesson, lessonIndex) =>
        lessonIndex === index ? { ...lesson, ...patch } : lesson,
      ),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (editingId) {
        await appService.updateCourse(editingId, form);
        pushToast({ title: "Kurs yangilandi", tone: "success" });
      } else {
        await appService.createCourse(form);
        pushToast({ title: "Kurs yaratildi", tone: "success" });
      }
      setRefreshKey((value) => value + 1);
      resetForm();
    } catch (error) {
      pushToast({
        title: "Kurs saqlanmadi",
        description: error instanceof Error ? error.message : "Xatolik",
        tone: "error",
      });
    }
  }

  function startEdit(courseId: string) {
    const course = courses.find((item) => item.id === courseId);
    if (!course) return;

    setEditingId(courseId);
    setForm({
      title: course.title,
      description: course.description,
      category: course.category,
      coverImage: course.coverImage ?? "",
      lessons: course.lessons.map((lesson) => ({
        title: lesson.title,
        summary: lesson.summary,
        videoUrl: lesson.videoUrl,
        durationMinutes: lesson.durationMinutes,
        assignmentType: lesson.assignmentType,
        assignmentPrompt: lesson.assignmentPrompt,
        brokenCode: lesson.brokenCode ?? "",
        solutionCode: lesson.solutionCode ?? "",
        language: lesson.language ?? "javascript",
      })),
    });
    setOpen(true);
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin / Courses"
        title={t("admin_courses_title")}
        description={t("admin_courses_description")}
        actions={
          <button type="button" onClick={() => setOpen(true)} className="button-primary gap-2">
            <Plus size={16} />
            {t("admin_courses_create")}
          </button>
        }
      />

      {courses.length === 0 ? (
        <EmptyState title={t("admin_courses_empty")} description={t("admin_courses_empty_description")} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {courses.map((course) => (
            <article key={course.id} className="panel space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {t(`course_category_${course.category}`)}
                  </span>
                  <h3 className="text-xl font-semibold">{course.title}</h3>
                  <p className="text-sm text-slate-500">{course.description}</p>
                </div>
                <button type="button" onClick={() => startEdit(course.id)} className="button-secondary p-3">
                  <Pencil size={16} />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-950">
                  <p className="text-slate-500">Darslar</p>
                  <p className="mt-1 text-lg font-semibold">{course.lessons.length}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-950">
                  <p className="text-slate-500">Umumiy vaqt</p>
                  <p className="mt-1 text-lg font-semibold">{course.totalDurationMinutes} min</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-950">
                  <p className="text-slate-500">{t("common_required")}</p>
                  <p className="mt-1 text-lg font-semibold">Video + task</p>
                </div>
              </div>
              <div className="space-y-2">
                {course.lessons.map((lesson) => (
                  <div key={lesson.id} className="rounded-2xl border border-slate-200 p-3 text-sm dark:border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">
                        {lesson.order}. {lesson.title}
                      </p>
                      <span className="text-slate-500">{lesson.durationMinutes} min</span>
                    </div>
                    <p className="mt-2 text-slate-500">{lesson.summary}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {t(`lesson_assignment_${lesson.assignmentType}`)}: {lesson.assignmentPrompt}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={resetForm}
        title={editingId ? "Kursni tahrirlash" : t("admin_courses_create")}
        description="Har bir darsda video va undan keyingi topshiriq bo'lishi shart."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="input md:col-span-2"
              placeholder="Kurs nomi"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
            <textarea
              className="input md:col-span-2 min-h-28"
              placeholder="Kurs tavsifi"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
            <select
              className="input"
              value={form.category}
              onChange={(event) =>
                setForm({ ...form, category: event.target.value as CourseCategory })
              }
            >
              <option value="mathematics">{t("course_category_mathematics")}</option>
              <option value="english">{t("course_category_english")}</option>
              <option value="russian">{t("course_category_russian")}</option>
              <option value="programming">{t("course_category_programming")}</option>
            </select>
            <input
              className="input"
              placeholder="Cover image URL (ixtiyoriy)"
              value={form.coverImage}
              onChange={(event) => setForm({ ...form, coverImage: event.target.value })}
            />
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-950">
            Umumiy davomiylik: <span className="font-semibold">{totalDuration} min</span>
          </div>

          <div className="space-y-4">
            {form.lessons.map((lesson, index) => (
              <div key={index} className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-semibold">Dars {index + 1}</h3>
                  {form.lessons.length > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          lessons: current.lessons.filter((_, lessonIndex) => lessonIndex !== index),
                        }))
                      }
                      className="button-danger p-3"
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    className="input md:col-span-2"
                    placeholder="Dars nomi"
                    value={lesson.title}
                    onChange={(event) => updateLesson(index, { title: event.target.value })}
                  />
                  <textarea
                    className="input md:col-span-2 min-h-24"
                    placeholder="Qisqacha mazmun"
                    value={lesson.summary}
                    onChange={(event) => updateLesson(index, { summary: event.target.value })}
                  />
                  <input
                    className="input"
                    placeholder="Video URL (mp4 tavsiya qilinadi)"
                    value={lesson.videoUrl}
                    onChange={(event) => updateLesson(index, { videoUrl: event.target.value })}
                  />
                  <input
                    className="input"
                    type="number"
                    min={1}
                    placeholder="Davomiylik"
                    value={lesson.durationMinutes}
                    onChange={(event) =>
                      updateLesson(index, { durationMinutes: Number(event.target.value) })
                    }
                  />
                  <select
                    className="input"
                    value={lesson.assignmentType}
                    onChange={(event) =>
                      updateLesson(index, { assignmentType: event.target.value as LessonAssignmentType })
                    }
                  >
                    <option value="image">{t("lesson_assignment_image")}</option>
                    <option value="voice">{t("lesson_assignment_voice")}</option>
                    <option value="code_puzzle">{t("lesson_assignment_code_puzzle")}</option>
                  </select>
                  <input
                    className="input"
                    placeholder="Topshiriq matni"
                    value={lesson.assignmentPrompt}
                    onChange={(event) => updateLesson(index, { assignmentPrompt: event.target.value })}
                  />
                  {lesson.assignmentType === "code_puzzle" ? (
                    <>
                      <select
                        className="input md:col-span-2"
                        value={lesson.language}
                        onChange={(event) =>
                          updateLesson(index, { language: event.target.value as ProgrammingLanguage })
                        }
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="cpp">C++</option>
                        <option value="csharp">C#</option>
                      </select>
                      <textarea
                        className="input min-h-36 md:col-span-2 font-mono"
                        placeholder="Buzilgan kod"
                        value={lesson.brokenCode}
                        onChange={(event) => updateLesson(index, { brokenCode: event.target.value })}
                      />
                      <textarea
                        className="input min-h-36 md:col-span-2 font-mono"
                        placeholder="To'g'ri yechim"
                        value={lesson.solutionCode}
                        onChange={(event) => updateLesson(index, { solutionCode: event.target.value })}
                      />
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setForm((current) => ({ ...current, lessons: [...current.lessons, initialLesson()] }))
            }
            className="button-secondary w-full"
          >
            + Dars qo'shish
          </button>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={resetForm} className="button-secondary w-full sm:w-auto">
              {t("common_cancel")}
            </button>
            <button type="submit" className="button-primary w-full sm:w-auto">
              {editingId ? t("common_save") : t("common_create")}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
