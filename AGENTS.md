<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Financial math lives only in pure modules under src/lib (financialCalculations.ts) with unit tests; UI never computes figures itself — keeps results deterministic and testable.
- Simulation state is in-memory guest state (src/services/simulationStore.ts); no auth or remote DB — MVP is guest-first.
- PDF export is client-side only via jsPDF (src/lib/pdfExport.ts) — no external services or AI.
