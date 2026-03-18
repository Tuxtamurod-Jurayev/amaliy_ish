import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl dark:text-slate-100">
          {title}
        </h1>
      </div>
      {actions ? <div className="flex w-full flex-wrap gap-3 md:w-auto md:justify-end">{actions}</div> : null}
    </div>
  );
}
