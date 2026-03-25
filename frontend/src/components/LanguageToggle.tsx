import { useI18n } from "@/hooks/useI18n";
import { useAppStore } from "@/store/useAppStore";
import type { LanguageCode } from "@/types/domain";

const options: LanguageCode[] = ["uz", "en", "ru"];

export function LanguageToggle() {
  const { language, t } = useI18n();
  const setLanguage = useAppStore((state) => state.setLanguage);

  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 p-1 dark:border-slate-800">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLanguage(option)}
          className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase transition ${
            language === option
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"
              : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
          title={t(`language_${option}`)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
