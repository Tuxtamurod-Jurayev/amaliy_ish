import { FormEvent, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { PageHeader } from "@/components/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { appService } from "@/services/appService";
import { useAppStore } from "@/store/useAppStore";

const initialForm = {
  name: "",
  email: "",
  login: "",
  password: "",
  department: "",
};

export function TeachersPage() {
  const pushToast = useAppStore((state) => state.pushToast);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [refreshKey, setRefreshKey] = useState(0);
  const [teachers, setTeachers] = useState<Awaited<ReturnType<typeof appService.getTeachers>>>([]);

  useEffect(() => {
    let active = true;
    appService.getTeachers().then((items) => {
      if (active) setTeachers(items);
    });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const filtered = teachers.filter((teacher) =>
    [teacher.account.name, teacher.account.email, teacher.account.login, teacher.profile.department]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const pageSize = 4;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
    setOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (editingId) {
        await appService.updateTeacher(editingId, form);
        pushToast({ title: "Teacher yangilandi", tone: "success" });
      } else {
        await appService.createTeacher(form);
        pushToast({ title: "Teacher qo'shildi", tone: "success" });
      }
      setRefreshKey((value) => value + 1);
      resetForm();
    } catch (error) {
      pushToast({
        title: "Saqlashda xatolik",
        description: error instanceof Error ? error.message : "Noma'lum xatolik",
        tone: "error",
      });
    }
  }

  function startEdit(teacherId: string) {
    const teacher = teachers.find((item) => item.profile.id === teacherId);
    if (!teacher) return;
    setEditingId(teacherId);
    setForm({
      name: teacher.account.name,
      email: teacher.account.email ?? "",
      login: teacher.account.login,
      password: teacher.account.password,
      department: teacher.profile.department ?? "",
    });
    setOpen(true);
  }

  async function handleDelete(teacherId: string) {
    try {
      await appService.deleteTeacher(teacherId);
      setRefreshKey((value) => value + 1);
      pushToast({ title: "Teacher o'chirildi", tone: "success" });
    } catch (error) {
      pushToast({
        title: "O'chirishda xatolik",
        description: error instanceof Error ? error.message : "Noma'lum xatolik",
        tone: "error",
      });
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin / Teachers"
        title="O'qituvchilar"
        description="Teacher accountlar, loginlar va department ma'lumotlarini boshqaring."
        actions={
          <button type="button" onClick={() => setOpen(true)} className="button-primary gap-2">
            <Plus size={16} />
            Teacher qo'shish
          </button>
        }
      />

      <div className="panel flex items-center gap-3">
        <Search size={18} className="text-slate-400" />
        <input
          className="w-full bg-transparent outline-none"
          placeholder="Teacher qidirish..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Teacher topilmadi" description="Qidiruvni o'zgartiring yoki yangi teacher qo'shing." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {paginated.map((teacher) => (
            <div key={teacher.profile.id} className="panel">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{teacher.account.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{teacher.account.email}</p>
                  <p className="mt-3 text-sm">
                    <span className="font-medium">Login:</span> {teacher.account.login}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Parol:</span> {teacher.account.password}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{teacher.profile.department || "Department kiritilmagan"}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => startEdit(teacher.profile.id)} className="button-secondary p-3">
                    <Pencil size={16} />
                  </button>
                  <button type="button" onClick={() => handleDelete(teacher.profile.id)} className="button-danger p-3">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal
        open={open}
        onClose={resetForm}
        title={editingId ? "Teacher yangilash" : "Teacher qo'shish"}
        description="Teacher uchun login va parol shu yerda yaratiladi."
      >
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <input className="input" placeholder="Ism" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" placeholder="Login" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} />
          <input className="input" placeholder="Parol" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input className="input md:col-span-2" placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <div className="md:col-span-2 flex justify-end gap-3">
            <button type="button" onClick={resetForm} className="button-secondary">Bekor qilish</button>
            <button type="submit" className="button-primary">Saqlash</button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
