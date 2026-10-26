import { useLanguage } from "@/i18n/LanguageContext";
import type { Language } from "@/i18n/translations";

const TOGGLE_LABELS: Record<Language, string> = {
  en: "EN",
  vi: "VI",
};

export function FloatingLanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex items-center gap-1 rounded-full border border-border bg-card/95 p-1 shadow-lg backdrop-blur md:bottom-6 md:right-6"
      role="group"
      aria-label="Language"
    >
      {(Object.keys(TOGGLE_LABELS) as Language[]).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLanguage(code)}
          aria-pressed={language === code}
          className={
            "min-w-9 rounded-full px-3 py-1.5 text-xs font-bold transition-colors " +
            (language === code
              ? "bg-navy text-navy-foreground"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {TOGGLE_LABELS[code]}
        </button>
      ))}
    </div>
  );
}
