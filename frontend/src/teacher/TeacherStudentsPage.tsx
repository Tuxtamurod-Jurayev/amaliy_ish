import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Download, Plus, Search, Upload } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { PageHeader } from "@/components/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { appService } from "@/services/appService";
import { useAppStore } from "@/store/useAppStore";
import { downloadTextFile } from "@/utils/format";
import type { GeneratedStudentCredentials } from "@/types/domain";

const initialForm = {
  name: "",
  groupName: "",
  studentCode: "",
  subjectIds: [] as string[],
};

export function TeacherStudentsPage() {
  const session = useAppStore((state) => state.session);
  const userId = session?.user.id ?? "";
  const pushToast = useAppStore((state) => state.pushToast);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [groupFilter, setGroupFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [refreshKey, setRefreshKey] = useState(0);
  const [generatedCredentials, setGeneratedCredentials] = useState<GeneratedStudentCredentials[]>([]);
  const [importing, setImporting] = useState(false);
  const [dashboard, setDashboard] = useState<Awaited<ReturnType<typeof appService.getTeacherDashboard>> | null>(null);
  const [students, setStudents] = useState<Awaited<ReturnType<typeof appService.getStudentsForTeacher>>>([]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    Promise.all([appService.getTeacherDashboard(userId), appService.getStudentsForTeacher(userId)]).then(
      ([dashboardValue, studentValues]) => {
        if (!active) return;
        setDashboard(dashboardValue);
        setStudents(studentValues);
      },
    );
    return () => {
      active = false;
    };
  }, [userId, refreshKey]);

  const groups = useMemo(() => Array.from(new Set(students.map((item) => item.profile.groupName))), [students]);
  const filtered = useMemo(
    () =>
      students.filter((student) => {
        const matchesQuery = [student.account.name, student.profile.studentCode, student.account.login]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesGroup = groupFilter === "all" || student.profile.groupName === groupFilter;
        return matchesQuery && matchesGroup;
      }),
    [groupFilter, query, students],
  );
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  if (!userId || !dashboard) return null;

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (form.subjectIds.length === 0) {
      pushToast({
        title: "Avval fan tanlang",
        description: "Import qilinadigan studentlar uchun kamida bitta fan belgilang.",
        tone: "error",
      });
      return;
    }

    try {
      setImporting(true);
      const rows = await appService.parseImportFile(file);
      const credentials = await appService.importStudents(userId, rows, form.subjectIds);
      setGeneratedCredentials(credentials);
      setRefreshKey((value) => value + 1);
      pushToast({
        title: "Import yakunlandi",
        description: `${credentials.length} ta student yaratildi`,
        tone: "success",
      });
    } catch (error) {
      pushToast({
        title: "Importda xatolik",
        description: error instanceof Error ? error.message : "Fayl o'qilmadi",
        tone: "error",
      });
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = await appService.createStudent(userId, form);
      setGeneratedCredentials([result.credentials]);
      setRefreshKey((value) => value + 1);
      setOpen(false);
      setForm(initialForm);
      pushToast({ title: "Student qo'shildi", tone: "success" });
    } catch (error) {
      pushToast({
        title: "Student yaratilmadi",
        description: error instanceof Error ? error.message : "Xatolik",
        tone: "error",
      });
    }
  }

  function downloadCredentials() {
    const text = generatedCredentials
      .map((item) => `${item.name} | ${item.groupName} | ${item.studentCode} | ${item.login} | ${item.password}`)
      .join("\n");
    downloadTextFile("student-credentials.txt", text);
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Teacher / Students"
        title="Talabalar"
        description="Qo'lda student qo'shish, Excel orqali import qilish va yaratilgan login/parollarni olish."
        actions={
          <button type="button" onClick={() => setOpen(true)} className="button-primary gap-2">
            <Plus size={16} />
            Student qo'shish
          </button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel space-y-4">
          <div className="flex items-center gap-3">
            <Search size={18} className="text-slate-400" />
            <input
              className="w-full bg-transparent outline-none"
              placeholder="Student qidirish..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select className="input" value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}>
            <option value="all">Barcha guruhlar</option>
            {groups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>

          {filtered.length === 0 ? (
            <EmptyState title="Student topilmadi" description="Qidiruv yoki filtrni o'zgartiring." />
          ) : (
            <div className="space-y-3">
              {paginated.map((student) => (
                <div key={student.profile.id} className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{student.account.name}</h3>
                      <p className="text-sm text-slate-500">
                        {student.profile.groupName} | {student.profile.studentCode}
                      </p>
                      <p className="mt-2 text-sm">
                        Login: {student.account.login} | Parol: {student.account.password}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {student.subjects.map((subject) => (
                        <span key={subject.id} className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {subject.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>

        <div className="panel space-y-4">
          <div>
            <h3 className="font-display text-2xl font-semibold">Excel / CSV yuklash</h3>
            <p className="mt-2 text-sm text-slate-500">
              `name`, `group`, `student_id` ustunlari bo'lgan `xlsx`, `xls`, `csv` fayllarni yuklang.
            </p>
          </div>

          <div className="rounded-3xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
            <p className="mb-3 text-sm font-medium">Import qilinadigan fanlar</p>
            <div className="grid gap-2">
              {dashboard.subjectCards.map((subject) => (
                <label key={subject.id} className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={form.subjectIds.includes(subject.id)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        subjectIds: event.target.checked
                          ? [...current.subjectIds, subject.id]
                          : current.subjectIds.filter((item) => item !== subject.id),
                      }))
                    }
                  />
                  {subject.name}
                </label>
              ))}
            </div>
            <label className="button-secondary mt-4 flex w-full cursor-pointer gap-2">
              <Upload size={16} />
              {importing ? "Yuklanmoqda..." : "Import fayl tanlash"}
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
            </label>
          </div>

          {generatedCredentials.length > 0 ? (
            <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-950">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold">Yaratilgan login/parollar</h4>
                <button type="button" onClick={downloadCredentials} className="button-secondary gap-2">
                  <Download size={16} />
                  TXT yuklash
                </button>
              </div>
              <div className="mt-4 max-h-72 space-y-2 overflow-auto text-sm">
                {generatedCredentials.map((item, index) => (
                  <div key={`${item.login}-${index}`} className="rounded-2xl bg-white p-3 dark:bg-slate-900">
                    {item.name} | {item.login} | {item.password}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Student qo'shish"
        description="Studentga fan biriktiring va tizim avtomatik login/parol yaratadi."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input className="input" placeholder="Ism" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input" placeholder="Guruh" value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value })} />
            <input className="input md:col-span-2" placeholder="Student ID" value={form.studentCode} onChange={(e) => setForm({ ...form, studentCode: e.target.value })} />
          </div>
          <div className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
            <p className="text-sm font-medium">Fanlar</p>
            <div className="mt-3 grid gap-2">
              {dashboard.subjectCards.map((subject) => (
                <label key={subject.id} className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={form.subjectIds.includes(subject.id)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        subjectIds: event.target.checked
                          ? [...current.subjectIds, subject.id]
                          : current.subjectIds.filter((item) => item !== subject.id),
                      }))
                    }
                  />
                  {subject.name}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)} className="button-secondary">Bekor qilish</button>
            <button type="submit" className="button-primary">Saqlash</button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
