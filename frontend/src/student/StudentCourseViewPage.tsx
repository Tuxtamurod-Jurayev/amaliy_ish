import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Lock, PlayCircle } from "lucide-react";
import { useParams } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { useI18n } from "@/hooks/useI18n";
import { appService } from "@/services/appService";
import { useAppStore } from "@/store/useAppStore";

export function StudentCourseViewPage() {
  const { courseId = "" } = useParams();
  const session = useAppStore((state) => state.session);
  const pushToast = useAppStore((state) => state.pushToast);
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const maxWatchedRef = useRef(0);
  const lastSavedRef = useRef(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [course, setCourse] = useState<Awaited<ReturnType<typeof appService.getStudentCourse>> | null>(null);
  const [activeLessonId, setActiveLessonId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [puzzleCode, setPuzzleCode] = useState("");

  useEffect(() => {
    if (!session || !courseId) return;
    let active = true;
    appService.getStudentCourse(session.user.id, courseId).then((value) => {
      if (active) setCourse(value);
    });
    return () => {
      active = false;
    };
  }, [courseId, refreshKey, session]);

  const activeLesson = useMemo(() => {
    if (!course) return undefined;
    return course.lessons.find((item) => item.lesson.id === activeLessonId) ?? course.lessons[0];
  }, [activeLessonId, course]);

  useEffect(() => {
    if (!course) return;
    const preferred =
      course.lessons.find((item) => item.unlocked && !item.progress?.completedAssignment)?.lesson.id ??
      course.lessons.find((item) => item.unlocked)?.lesson.id ??
      course.lessons[0]?.lesson.id ??
      "";
    setActiveLessonId(preferred);
  }, [course]);

  useEffect(() => {
    setSelectedFile(null);
    setPuzzleCode(activeLesson?.submission?.code ?? activeLesson?.lesson.brokenCode ?? "");
    maxWatchedRef.current = activeLesson?.progress?.watchedSeconds ?? 0;
    lastSavedRef.current = maxWatchedRef.current;
  }, [activeLesson]);

  if (!session) return null;
  if (!course || !activeLesson) {
    return <EmptyState title="Kurs topilmadi" description="Kurs ma'lumotlari yuklanmadi." />;
  }

  const currentSession = session;
  const currentCourse = course;
  const currentLesson = activeLesson;
  const lessonIndex = currentCourse.lessons.findIndex((item) => item.lesson.id === currentLesson.lesson.id);
  const nextLesson = currentCourse.lessons[lessonIndex + 1];
  const canSubmitAssignment = Boolean(currentLesson.progress?.completedVideo);

  async function persistWatch(seconds: number, completedVideo: boolean) {
    await appService.updateLessonWatch(
      currentSession.user.id,
      currentCourse.id,
      currentLesson.lesson.id,
      seconds,
      completedVideo,
    );
  }

  async function handleVideoTimeUpdate() {
    const element = videoRef.current;
    if (!element) return;
    if (element.currentTime > maxWatchedRef.current) {
      maxWatchedRef.current = element.currentTime;
    }
    if (maxWatchedRef.current - lastSavedRef.current >= 8) {
      lastSavedRef.current = maxWatchedRef.current;
      await persistWatch(maxWatchedRef.current, false);
    }
  }

  async function handleVideoEnded() {
    const seconds = videoRef.current?.duration ?? maxWatchedRef.current;
    await persistWatch(seconds, true);
    setRefreshKey((value) => value + 1);
    pushToast({ title: t("student_courses_marked"), tone: "success" });
  }

  function handleSeeking() {
    const element = videoRef.current;
    if (!element) return;
    if (element.currentTime > maxWatchedRef.current + 1) {
      element.currentTime = maxWatchedRef.current;
    }
  }

  async function handleMediaSubmit() {
    if (!selectedFile) return;
    try {
      await appService.submitLessonMedia(
        currentSession.user.id,
        currentCourse.id,
        currentLesson.lesson.id,
        selectedFile,
      );
      pushToast({ title: "Topshiriq yuborildi", tone: "success" });
      setRefreshKey((value) => value + 1);
    } catch (error) {
      pushToast({
        title: "Topshiriq yuborilmadi",
        description: error instanceof Error ? error.message : "Xatolik",
        tone: "error",
      });
    }
  }

  async function handlePuzzleSubmit() {
    try {
      const result = await appService.submitLessonPuzzle(
        currentSession.user.id,
        currentCourse.id,
        currentLesson.lesson.id,
        puzzleCode,
      );
      pushToast({
        title: result.autoCheck === "passed" ? "Puzzle to'g'ri bajarildi" : "Puzzle hali noto'g'ri",
        tone: result.autoCheck === "passed" ? "success" : "error",
      });
      setRefreshKey((value) => value + 1);
    } catch (error) {
      pushToast({
        title: "Puzzle yuborilmadi",
        description: error instanceof Error ? error.message : "Xatolik",
        tone: "error",
      });
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Student / Course" title={currentCourse.title} description={currentCourse.description} />

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="panel space-y-3">
          {currentCourse.lessons.map((item) => (
            <button
              key={item.lesson.id}
              type="button"
              disabled={!item.unlocked}
              onClick={() => item.unlocked && setActiveLessonId(item.lesson.id)}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                currentLesson.lesson.id === item.lesson.id
                  ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950"
                  : "border-slate-200 bg-white hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">
                    {item.lesson.order}. {item.lesson.title}
                  </p>
                  <p className="mt-1 text-xs opacity-80">{item.lesson.durationMinutes} min</p>
                </div>
                {item.unlocked ? (
                  item.progress?.completedAssignment ? <CheckCircle2 size={16} /> : <PlayCircle size={16} />
                ) : (
                  <Lock size={16} />
                )}
              </div>
            </button>
          ))}
        </aside>

        <div className="space-y-4">
          <div className="panel space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">
                  {t(`course_category_${currentCourse.category}`)} • {currentLesson.lesson.durationMinutes} min
                </p>
                <h2 className="mt-1 text-2xl font-semibold">{currentLesson.lesson.title}</h2>
              </div>
              <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {currentLesson.progress?.completedAssignment
                  ? t("course_player_status_completed")
                  : t("course_player_status_pending")}
              </span>
            </div>

            <p className="text-sm text-slate-500">{currentLesson.lesson.summary}</p>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-black dark:border-slate-800">
              <video
                ref={videoRef}
                src={currentLesson.lesson.videoUrl}
                controls
                controlsList="nodownload noplaybackrate"
                className="aspect-video w-full bg-black"
                onSeeking={handleSeeking}
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={handleVideoEnded}
              />
            </div>

            {!currentLesson.progress?.completedVideo ? (
              <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                {t("course_player_watch_full")}
              </div>
            ) : null}
          </div>

          <div className="panel space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{t("student_courses_assignment")}</p>
              <h3 className="mt-2 text-xl font-semibold">
                {t(`lesson_assignment_${currentLesson.lesson.assignmentType}`)}
              </h3>
              <p className="mt-2 text-sm text-slate-500">{currentLesson.lesson.assignmentPrompt}</p>
            </div>

            {currentLesson.lesson.assignmentType === "code_puzzle" ? (
              <div className="space-y-3">
                <textarea
                  className="input min-h-64 font-mono"
                  value={puzzleCode}
                  onChange={(event) => setPuzzleCode(event.target.value)}
                />
                <button
                  type="button"
                  disabled={!canSubmitAssignment}
                  onClick={handlePuzzleSubmit}
                  className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {t("student_courses_submit")}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="file"
                  accept={currentLesson.lesson.assignmentType === "image" ? "image/*" : "audio/*"}
                  className="input"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  disabled={!canSubmitAssignment || !selectedFile}
                  onClick={handleMediaSubmit}
                  className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {currentLesson.lesson.assignmentType === "image"
                    ? t("course_player_upload_image")
                    : t("course_player_upload_voice")}
                </button>
              </div>
            )}

            {currentLesson.submission ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:bg-slate-950">
                Status: {currentLesson.submission.status} • Auto-check: {currentLesson.submission.autoCheck}
              </div>
            ) : null}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!nextLesson || !currentLesson.progress?.completedAssignment}
              onClick={() => nextLesson && setActiveLessonId(nextLesson.lesson.id)}
              className="button-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("course_player_next")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
