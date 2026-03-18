import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, description, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4">
      <div className="panel relative z-50 max-h-[92vh] w-full overflow-auto rounded-b-none rounded-t-[2rem] sm:max-w-3xl sm:rounded-[2rem]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X size={18} />
        </button>
        <div className="pr-12">
          <h3 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h3>
          {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
