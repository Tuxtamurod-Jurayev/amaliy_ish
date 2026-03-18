import { FormEvent, useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { appService } from "@/services/appService";
import { useAppStore } from "@/store/useAppStore";

type SubjectForm = {
  name: string;
  teacherId: string;
  type: "programming" | "file";
};

const initialForm = {
  name: "",
  teacherId: "",
  type: "programming" as const,
} satisfies SubjectForm;

export function SubjectsPage() {
  const pushToast = useAppStore((state) => state.pushToast);
  const [form, setForm] = useState<SubjectForm>(initialForm);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [subjects, setSubjects] = useState<Awaited<ReturnType<typeof appService.getSubjects>>>([]);
  const [teachers, setTeachers] = useState<Awaited<ReturnType<typeof appService.getTeachers>>>([]);

  useEffect(() => {
    let active = true;
    Promise.all([appService.getSubjects(), appService.getTeachers()]).then(([subjectItems, teacherItems]) => {
      if (!active) return;
      setSubjects(subjectItems);
      setTeachers(teacherItems);
    });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
    setOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (editingId) {
        await appService.updateSubject(editingId, form);
        pushToast({ title: "Fan yangilandi", tone: "success" });
      } else {
        await appService.createSubject(form);
        pushToast({ title: "Fan yaratildi", tone: "success" });
      }
      setRefreshKey((value) => value + 1);
      resetForm();
    } catch (error) {
      pushToast({
        title: "Fan saqlanmadi",
        description: error instanceof Error ? error.message : "Noma'lum xatolik",
        tone: "error",
      });
    }
  }

  function startEdit(subjectId: string) {
    const subject = subjects.find((item) => item.id === subjectId);
    if (!subject) return;
    setEditingId(subjectId);
    setForm({
      name: subject.name,
      teacherId: subject.teacherId,
      type: subject.type,
    });
    setOpen(true);
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin / Subjects"
        title="Fanlar"
        description="Programming yoki file turidagi fanlarni teacherlarga biriktiring."
        actions={
          <button type="button" onClick={() => setOpen(true)} className="button-primary gap-2">
            <Plus size={16} />
            Fan qo'shish
          </button>
        }
      />

      {subjects.length === 0 ? (
        <EmptyState title="Fanlar yo'q" description="Birinchi faningizni shu sahifada yarating." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {subjects.map((subject) => (
            <div key={subject.id} className="panel">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="badge bg-orange-100 text-orange-900 dark:bg-orange-500/15 dark:text-orange-300">
                    {subject.type}
                  </div>
                  <h3 className="mt-3 text-xl font-semibold">{subject.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">{subject.teacher.account.name}</p>
                </div>
                <button type="button" onClick={() => startEdit(subject.id)} className="button-secondary p-3">
                  <Pencil size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={resetForm}
        title={editingId ? "Fan yangilash" : "Yangi fan"}
        description="Teacher va fan turini tanlang."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="input" placeholder="Fan nomi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="input" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}>
            <option value="">Teacher tanlang</option>
            {teachers.map((teacher) => (
              <option key={teacher.profile.id} value={teacher.profile.id}>
                {teacher.account.name}
              </option>
            ))}
          </select>
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "programming" | "file" })}>
            <option value="programming">programming</option>
            <option value="file">file</option>
          </select>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={resetForm} className="button-secondary">Bekor qilish</button>
            <button type="submit" className="button-primary">Saqlash</button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
