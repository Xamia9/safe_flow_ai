export function AppFooter() {
  return (
    <footer className="border-t border-white/10 bg-transparent">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground sm:px-6">
        <p className="font-medium text-foreground">SafeFlow AI</p>
        <p className="mt-1 max-w-2xl">
          SafeFlow AI is a planning and simulation tool, not financial advice. Projections are
          deterministic estimates based only on the figures you enter. Your data stays in this
          browser tab.
        </p>
      </div>
    </footer>
  );
}
