interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-slate-500">
        Sahifa {page} / {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="button-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Oldingi
        </button>
        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          className="button-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Keyingi
        </button>
      </div>
    </div>
  );
}
