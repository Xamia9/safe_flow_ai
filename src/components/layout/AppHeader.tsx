import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, ShieldCheck, X, Languages, Check } from "lucide-react";
import { useLanguage, useT } from "@/i18n/LanguageContext";
import { LANGUAGES } from "@/i18n/translations";
import type { TranslationKey } from "@/i18n/translations";

const navItems: { to: string; label: TranslationKey }[] = [
  { to: "/", label: "nav.home" },
  { to: "/simulate/input", label: "nav.profile" },
  { to: "/simulate/dashboard", label: "nav.dashboard" },
  { to: "/simulate/action-plan", label: "nav.actionPlan" },
] as const;

export function AppHeader() {
  const t = useT();
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-1.5 font-display text-lg font-bold text-primary">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-navy text-navy-foreground">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span className="flex items-baseline">
            SafeFlow<span className="ml-0.5 text-teal">AI</span>
          </span>
        </Link>
        <nav aria-label="Main" className="hidden gap-1 md:flex">
          {navItems.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {t(n.label)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          {/* Language switcher */}
          <div className="relative">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label={t("nav.language")}
              aria-haspopup="menu"
              aria-expanded={langOpen}
              onClick={() => setLangOpen((o) => !o)}
            >
              <Languages className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{LANGUAGES.find((l) => l.code === language)?.label}</span>
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} aria-hidden />
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-md border bg-popover p-1 shadow-md"
                >
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      role="menuitemradio"
                      aria-checked={language === l.code}
                      onClick={() => { setLanguage(l.code); setLangOpen(false); }}
                      className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-secondary"
                    >
                      <span>{l.label}</span>
                      {language === l.code && <Check className="h-3.5 w-3.5 text-teal" aria-hidden />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            className="rounded-md p-2 md:hidden"
            aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav aria-label="Mobile" className="border-t px-4 py-2 md:hidden">
          {navItems.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium"
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-secondary" }}
            >
              {t(n.label)}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
