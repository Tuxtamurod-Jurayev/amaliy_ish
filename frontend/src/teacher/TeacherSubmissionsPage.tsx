import { FormEvent, useEffect, useState } from "react";
import { CheckCheck, FileWarning, XCircle } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { PageHeader } from "@/components/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { appService } from "@/services/appService";
import { useAppStore } from "@/store/useAppStore";
import { formatDate } from "@/utils/format";

export function TeacherSubmissionsPage() {
  const session = useAppStore((state) => state.session);
  const userId = session?.user.id ?? "";
  const pushToast = useAppStore((state) => state.pushToast);
  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(1);
  const [coverageFilter, setCoverageFilter] = useState<"all" | "submitted" | "missing">("all");
  const [reviewTarget, setReviewTarget] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"accepted" | "rejected">("accepted");
  const [comment, setComment] = useState("");
  const [submissions, setSubmissions] = useState<Awaited<ReturnType<typeof appService.getTeacherSubmissions>>>([]);
  const [coverage, setCoverage] = useState<Awaited<ReturnType<typeof appService.getAssignmentCoverage>>>([]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    Promise.all([appService.getTeacherSubmissions(userId), appService.getAssignmentCoverage(userId)]).then(
      ([submissionValues, coverageValues]) => {
        if (!active) return;
        setSubmissions(submissionValues);
        setCoverage(coverageValues);
      },
    );
    return () => {
      active = false;
    };
  }, [userId, refreshKey]);

  const filteredCoverage = coverage.filter((item) =>
    coverageFilter === "all"
      ? true
      : coverageFilter === "submitted"
        ? item.submitted
        : !item.submitted,
  );
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredCoverage.length / pageSize));
  const paginatedCoverage = filteredCoverage.slice((page - 1) * pageSize, page * pageSize);

  if (!userId) return null;

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reviewTarget) return;
    try {
      await appService.reviewSubmission(userId, reviewTarget, { status: reviewStatus, comment });
      pushToast({ title: "Submission baholandi", tone: "success" });
      setRefreshKey((value) => value + 1);
      setReviewTarget(null);
      setComment("");
      setReviewStatus("accepted");
    } catch (error) {
      pushToast({
        title: "Baholashda xatolik",
        description: error instanceof Error ? error.message : "Xatolik",
        tone: "error",
      });
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Teacher / Submissions"
        title="Topshiruvlar"
        description="Kim topshirgan va kim topshirmaganini ko'ring, keyin submissionni qabul qiling yoki rad eting."
      />

      <div className="panel">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h3 className="font-display text-2xl font-semibold">Coverage</h3>
          <select className="input max-w-xs" value={coverageFilter} onChange={(e) => setCoverageFilter(e.target.value as typeof coverageFilter)}>
            <option value="all">Barchasi</option>
            <option value="submitted">Faqat topshirganlar</option>
            <option value="missing">Faqat topshirmaganlar</option>
          </select>
        </div>
        <div className="mt-6 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="pb-3">Student</th>
                <th className="pb-3">Assignment</th>
                <th className="pb-3">Holat</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCoverage.map((item) => (
                <tr key={`${item.assignment.id}-${item.student.profile.id}`} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-3">{item.student.account.name}</td>
                  <td className="py-3">{item.assignment.title}</td>
                  <td className="py-3">{item.submitted ? "Topshirgan" : "Topshirmagan"}</td>
                  <td className="py-3">{item.submission ? item.submission.status : <span className="text-slate-400">submission yo'q</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>

      {submissions.length === 0 ? (
        <EmptyState title="Submissionlar yo'q" description="Student topshirgach shu yerda ko'rinadi." />
      ) : (
        <div className="grid gap-4">
          {submissions.map((item) => (
            <div key={item.submission.id} className="panel">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{item.assignment.subject.name}</span>
                    {item.submission.language ? (
                      <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{item.submission.language}</span>
                    ) : null}
                    <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{item.submission.status}</span>
                    <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{item.submission.autoCheck}</span>
                  </div>
                  <h3 className="text-xl font-semibold">{item.assignment.title}</h3>
                  <p className="text-sm text-slate-500">
                    {item.student.account.name} | {item.student.profile.groupName}
                  </p>
                  <p className="text-xs text-slate-500">Yuborilgan vaqt: {formatDate(item.submission.updatedAt)}</p>
                  {item.submission.code ? (
                    <pre className="mt-3 overflow-auto rounded-3xl bg-slate-950 p-4 text-xs text-slate-100">{item.submission.code}</pre>
                  ) : null}
                  {item.submission.file ? (
                    <div className="mt-3 rounded-3xl bg-slate-50 p-4 text-sm dark:bg-slate-950">
                      <a href={item.submission.file.content} target="_blank" rel="noreferrer" className="underline">
                        Fayl: {item.submission.file.name}
                      </a>{" "}
                      ({Math.round(item.submission.file.size / 1024)} KB)
                    </div>
                  ) : null}
                  {item.submission.submittedOutput ? (
                    <p className="text-sm text-slate-500">Output: {item.submission.submittedOutput}</p>
                  ) : null}
                  {item.submission.comment ? (
                    <p className="rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-950">Izoh: {item.submission.comment}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setReviewTarget(item.submission.id);
                      setReviewStatus("accepted");
                    }}
                    className="button-primary gap-2"
                  >
                    <CheckCheck size={16} />
                    Accept / Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={Boolean(reviewTarget)} onClose={() => setReviewTarget(null)} title="Submissionni baholash" description="Natija student panelida ko'rinadi.">
        <form onSubmit={submitReview} className="space-y-4">
          <select className="input" value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value as typeof reviewStatus)}>
            <option value="accepted">accepted</option>
            <option value="rejected">rejected</option>
          </select>
          <textarea className="input min-h-28" placeholder="Teacher izohi" value={comment} onChange={(e) => setComment(e.target.value)} />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setReviewTarget(null)} className="button-secondary gap-2">
              <XCircle size={16} />
              Bekor qilish
            </button>
            <button type="submit" className="button-primary gap-2">
              <FileWarning size={16} />
              Saqlash
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
