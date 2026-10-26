import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, ShieldCheck, X } from "lucide-react";
import { useT } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

const navItems: { to: string; label: TranslationKey }[] = [
  { to: "/", label: "nav.home" },
  { to: "/simulate/input", label: "nav.profile" },
  { to: "/simulate/dashboard", label: "nav.dashboard" },
  { to: "/simulate/action-plan", label: "nav.actionPlan" },
] as const;

export function AppHeader() {
  const t = useT();
  const [open, setOpen] = useState(false);

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
        <button
          className="rounded-md p-2 md:hidden"
          aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
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
