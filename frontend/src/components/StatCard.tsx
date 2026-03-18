interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
}

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="panel bg-gradient-to-br from-white to-orange-50 dark:from-slate-900 dark:to-slate-900">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 font-display text-4xl font-semibold">{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
