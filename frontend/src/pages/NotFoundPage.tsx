import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="panel max-w-lg text-center">
        <h1 className="font-display text-5xl font-semibold">404</h1>
        <p className="mt-3 text-slate-500">Sahifa topilmadi.</p>
        <Link to="/login" className="button-primary mt-6">
          Login sahifasiga qaytish
        </Link>
      </div>
    </div>
  );
}
