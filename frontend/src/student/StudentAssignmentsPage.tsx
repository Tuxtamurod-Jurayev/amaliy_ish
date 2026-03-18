import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { FileUp, Send } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { appService } from "@/services/appService";
import { useAppStore } from "@/store/useAppStore";
import { formatDate, relativeDeadline } from "@/utils/format";
import type { ProgrammingLanguage } from "@/types/domain";

const starterByLanguage = {
  javascript: `function solve(input) {\n  const [a, b] = input.split(" ").map(Number);\n  return a + b;\n}`,
  python: "def solve(input):\n    return None",
  cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  return 0;\n}",
  csharp: "using System;\n\npublic class Program {\n  public static void Main() {\n  }\n}",
};

export function StudentAssignmentsPage() {
  const session = useAppStore((state) => state.session);
  const userId = session?.user.id ?? "";
  const pushToast = useAppStore((state) => state.pushToast);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<ProgrammingLanguage>("javascript");
  const [assignments, setAssignments] = useState<Awaited<ReturnType<typeof appService.getStudentAssignments>>>([]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    appService.getStudentAssignments(userId).then((items) => {
      if (active) setAssignments(items);
    });
    return () => {
      active = false;
    };
  }, [userId, refreshKey]);

  const selected = assignments.find((item) => item.id === selectedId);

  useEffect(() => {
    if (!selected || selected.type !== "programming") return;
    setSelectedLanguage(selected.submission?.language ?? selected.language ?? "javascript");
  }, [selected]);

  if (!userId) return null;

  async function handleProgrammingSubmit() {
    if (!selected) return;
    try {
      const result = await appService.submitProgramming(userId, selected.id, code, selectedLanguage);
      setRefreshKey((value) => value + 1);
      setSelectedId(null);
      pushToast({
        title: "Kod topshirildi",
        description: selectedLanguage === "javascript" ? `Auto-check: ${result.autoCheck}` : "Manual review uchun yuborildi",
        tone: "success",
      });
    } catch (error) {
      pushToast({
        title: "Kod yuborilmadi",
        description: error instanceof Error ? error.message : "Xatolik",
        tone: "error",
      });
    }
  }

  async function handleFileSubmit() {
    if (!selected || !file) return;
    try {
      await appService.submitFile(userId, selected.id, file);
      setRefreshKey((value) => value + 1);
      setSelectedId(null);
      setFile(null);
      pushToast({ title: "Fayl topshirildi", tone: "success" });
    } catch (error) {
      pushToast({
        title: "Fayl yuborilmadi",
        description: error instanceof Error ? error.message : "Xatolik",
        tone: "error",
      });
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Student / Assignments"
        title="Mening topshiriqlarim"
        description="Programming topshiriqlarini editor orqali, file topshiriqlarini esa upload orqali yuboring."
      />

      {assignments.length === 0 ? (
        <EmptyState title="Topshiriqlar topilmadi" description="Teacher sizga hali topshiriq biriktirmagan." />
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="panel">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{assignment.type}</span>
                    {assignment.language ? (
                      <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">talab: {assignment.language}</span>
                    ) : null}
                    {assignment.submission?.language ? (
                      <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">ishlatilgan: {assignment.submission.language}</span>
                    ) : null}
                    {assignment.submission ? (
                      <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{assignment.submission.status}</span>
                    ) : null}
                  </div>
                  <h3 className="text-xl font-semibold">{assignment.title}</h3>
                  <p className="text-sm text-slate-500">{assignment.description}</p>
                  <p className="text-sm">
                    {assignment.subject.name} | Deadline: {formatDate(assignment.deadline)} ({relativeDeadline(assignment.deadline)})
                  </p>
                  {assignment.submission?.comment ? (
                    <p className="rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-950">Teacher izohi: {assignment.submission.comment}</p>
                  ) : null}
                  {assignment.submission?.autoCheck ? (
                    <p className="text-xs text-slate-500">Auto-check: {assignment.submission.autoCheck}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(assignment.id);
                    const nextLanguage = assignment.submission?.language ?? assignment.language ?? "javascript";
                    setSelectedLanguage(nextLanguage);
                    setCode(assignment.submission?.code ?? starterByLanguage[nextLanguage]);
                  }}
                  className="button-primary gap-2"
                >
                  {assignment.type === "programming" ? <Send size={16} /> : <FileUp size={16} />}
                  {assignment.submission ? "Qayta topshirish" : "Topshirish"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => {
          setSelectedId(null);
          setFile(null);
        }}
        title={selected?.title ?? "Topshiriq"}
        description={selected?.description}
      >
        {selected?.type === "programming" ? (
          <div className="space-y-4">
            <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950">
              {selectedLanguage === "javascript"
                ? `JavaScript tanlansa auto-check ishlaydi. Test input: ${selected.testInput}; expected: ${selected.expectedOutput}`
                : `${selectedLanguage} teacher review orqali baholanadi.`}
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
              <div>
                <label className="mb-2 block text-sm font-medium">Testlash tili</label>
                <select
                  className="input"
                  value={selectedLanguage}
                  onChange={(event) => {
                    const nextLanguage = event.target.value as ProgrammingLanguage;
                    setSelectedLanguage(nextLanguage);
                    setCode(starterByLanguage[nextLanguage]);
                  }}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                  <option value="csharp">C#</option>
                </select>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950">
                Tavsiya etilgan til: <span className="font-semibold text-slate-700 dark:text-slate-100">{selected.language ?? "javascript"}</span>
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800">
              <Editor
                height="min(58vh,420px)"
                theme="vs-dark"
                language={selectedLanguage === "csharp" ? "csharp" : selectedLanguage}
                value={code}
                onChange={(value) => setCode(value ?? "")}
                options={{ minimap: { enabled: false }, fontSize: 14, roundedSelection: true }}
              />
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setSelectedId(null)} className="button-secondary w-full sm:w-auto">Bekor qilish</button>
              <button type="button" onClick={handleProgrammingSubmit} className="button-primary w-full sm:w-auto">Yuborish</button>
            </div>
          </div>
        ) : selected ? (
          <div className="space-y-4">
            <input type="file" accept=".jpg,.jpeg,.png,.pdf,.zip" className="input" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950">
              {file ? `Tanlangan fayl: ${file.name}` : "jpg, png, pdf yoki zip fayl yuklang"}
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setSelectedId(null)} className="button-secondary w-full sm:w-auto">Bekor qilish</button>
              <button type="button" onClick={handleFileSubmit} className="button-primary w-full sm:w-auto">Yuborish</button>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
