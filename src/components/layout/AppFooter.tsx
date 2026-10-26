import { useT } from "@/i18n/LanguageContext";

export function AppFooter() {
  const t = useT();
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground sm:px-6">
        <p className="font-medium text-foreground">SafeFlow AI</p>
        <p className="mt-1 max-w-2xl">{t("footer.disclaimer")}</p>
      </div>
    </footer>
  );
}
