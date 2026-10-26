/**
 * Language context for SafeFlow AI.
 *
 * - English is the default on first visit.
 * - The user's explicit choice is persisted to localStorage (same approach
 *   as the guest simulation store) — no database, no sign-in.
 * - SSR-safe: the server always renders English; the client reconciles to
 *   the persisted language on mount inside a layout effect, so server and
 *   client markup never conflict on the first paint.
 * - Switching language updates the current page immediately without a full
 *   reload and preserves all in-memory simulation state (the simulation
 *   store is independent of this context).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LANGUAGE,
  en,
  vi,
  type Language,
  type TranslationKey,
} from "./translations";

const STORAGE_KEY = "safeflow:lang";

/** The translate function signature, reused by localized content modules. */
export type TranslateFn = (key: TranslationKey, params?: Record<string, string | number>) => string;

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  /** Translate a key with optional {param} interpolation. Falls back to English. */
  t: TranslateFn;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLanguage(): Language {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "en" || raw === "vi") return raw;
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_LANGUAGE;
}

function writeStoredLanguage(lang: Language) {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
}

/**
 * Replace {param} placeholders in a template string with provided values.
 */
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const v = params[key];
    return v === undefined ? match : String(v);
  });
}

interface ProviderState {
  language: Language;
  /** True until the client has reconciled to the persisted language. */
  hydrated: boolean;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProviderState>({
    language: DEFAULT_LANGUAGE,
    hydrated: false,
  });

  // Reconcile to the persisted language on the client only.
  useEffect(() => {
    const stored = readStoredLanguage();
    setState((prev) =>
      prev.language === stored && prev.hydrated
        ? prev
        : { language: stored, hydrated: true },
    );
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setState({ language: lang, hydrated: true });
    writeStoredLanguage(lang);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      const dict = state.language === "vi" ? vi : en;
      const value = dict[key] ?? en[key];
      if (import.meta.env.DEV && !en[key]) {
        // Surface missing keys during development without throwing.
        console.warn(`[i18n] Missing translation key: "${key}"`);
      }
      return interpolate(value, params);
    },
    [state.language],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ language: state.language, setLanguage, t }),
    [state.language, setLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}

/** Convenience hook returning just the translate function. */
export function useT(): LanguageContextValue["t"] {
  return useLanguage().t;
}
