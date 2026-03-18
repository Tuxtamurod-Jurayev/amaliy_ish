import { FormEvent, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { appService } from "@/services/appService";
import { useAppStore } from "@/store/useAppStore";
import { formatDate } from "@/utils/format";

type AssignmentForm = {
  title: string;
  description: string;
  subjectId: string;
  type: "programming" | "file";
  deadline: string;
  language: "javascript" | "python" | "cpp" | "csharp";
  assignToAll: boolean;
  targetStudentIds: string[];
  testInput: string;
  expectedOutput: string;
};

const initialForm = {
  title: "",
  description: "",
  subjectId: "",
  type: "programming" as const,
  deadline: "",
  language: "javascript" as const,
  assignToAll: true,
  targetStudentIds: [] as string[],
  testInput: "",
  expectedOutput: "",
} satisfies AssignmentForm;

export function TeacherAssignmentsPage() {
  const session = useAppStore((state) => state.session);
  const userId = session?.user.id ?? "";
  const pushToast = useAppStore((state) => state.pushToast);
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState<AssignmentForm>(initialForm);
  const [dashboard, setDashboard] = useState<Awaited<ReturnType<typeof appService.getTeacherDashboard>> | null>(null);
  const [assignments, setAssignments] = useState<Awaited<ReturnType<typeof appService.getTeacherAssignments>>>([]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    Promise.all([appService.getTeacherDashboard(userId), appService.getTeacherAssignments(userId)]).then(
      ([dashboardValue, assignmentValues]) => {
        if (!active) return;
        setDashboard(dashboardValue);
        setAssignments(assignmentValues);
      },
    );
    return () => {
      active = false;
    };
  }, [userId, refreshKey]);

  if (!userId || !dashboard) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await appService.createAssignment(userId, form);
      setRefreshKey((value) => value + 1);
      setOpen(false);
      setForm(initialForm);
      pushToast({ title: "Topshiriq yaratildi", tone: "success" });
    } catch (error) {
      pushToast({
        title: "Topshiriq yaratilmadi",
        description: error instanceof Error ? error.message : "Xatolik",
        tone: "error",
      });
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Teacher / Assignments"
        title="Topshiriqlar"
        description="Barcha studentlarga yoki alohida studentlarga topshiriq biriktiring."
        actions={
          <button type="button" onClick={() => setOpen(true)} className="button-primary gap-2">
            <Plus size={16} />
            Topshiriq yaratish
          </button>
        }
      />

      {assignments.length === 0 ? (
        <EmptyState title="Topshiriq yo'q" description="Birinchi assignmentni shu sahifada yarating." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="panel">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {assignment.type}
                    </span>
                    {assignment.language ? (
                      <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {assignment.language}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-xl font-semibold">{assignment.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{assignment.description}</p>
                  <p className="mt-4 text-sm">
                    <span className="font-medium">Fan:</span> {assignment.subject.name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Deadline:</span> {formatDate(assignment.deadline)}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Biriktirish:</span>{" "}
                    {assignment.assignToAll ? "Barcha studentlar" : `${assignment.targetStudentIds.length} ta student`}
                  </p>
                  {assignment.type === "programming" ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Test: input=`{assignment.testInput}` expected=`{assignment.expectedOutput}`
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Yangi topshiriq"
        description="Programming yoki file turida topshiriq yarating."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input className="input md:col-span-2" placeholder="Sarlavha" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <textarea className="input md:col-span-2 min-h-28" placeholder="Tavsif" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <select className="input" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
              <option value="">Fan tanlang</option>
              {dashboard.subjectCards.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "programming" | "file" })}>
              <option value="programming">programming</option>
              <option value="file">file</option>
            </select>
            <input
              className="input"
              type="datetime-local"
              onChange={(e) =>
                setForm({
                  ...form,
                  deadline: e.target.value ? new Date(e.target.value).toISOString() : "",
                })
              }
            />
            {form.type === "programming" ? (
              <select className="input" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value as typeof form.language })}>
                <option value="javascript">javascript</option>
                <option value="python">python</option>
                <option value="cpp">cpp</option>
                <option value="csharp">csharp</option>
              </select>
            ) : null}
          </div>

          {form.type === "programming" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <input className="input" placeholder="Test input" value={form.testInput} onChange={(e) => setForm({ ...form, testInput: e.target.value })} />
              <input className="input" placeholder="Expected output" value={form.expectedOutput} onChange={(e) => setForm({ ...form, expectedOutput: e.target.value })} />
            </div>
          ) : null}

          <div className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
            <label className="flex items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.assignToAll}
                onChange={(e) => setForm({ ...form, assignToAll: e.target.checked, targetStudentIds: [] })}
              />
              Barcha studentlarga biriktirish
            </label>
            {!form.assignToAll ? (
              <div className="mt-4 grid gap-2">
                {dashboard.students.map((student) => (
                  <label key={student.profile.id} className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={form.targetStudentIds.includes(student.profile.id)}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          targetStudentIds: event.target.checked
                            ? [...current.targetStudentIds, student.profile.id]
                            : current.targetStudentIds.filter((id) => id !== student.profile.id),
                        }))
                      }
                    />
                    {student.account.name} ({student.profile.groupName})
                  </label>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950">
            {form.type === "programming"
              ? "JavaScript assignmentlar avtomatik tekshiriladi. Qolgan tillar teacher review orqali baholanadi."
              : "File topshiriqlari uchun student jpg, png, pdf yoki zip formatida fayl yuklaydi."}
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)} className="button-secondary">Bekor qilish</button>
            <button type="submit" className="button-primary">Yaratish</button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
