# SafeFlow AI — Phase 1: Foundation, Design System, Routing, Layouts

Scope: project foundation only. No financial engine, no AI, no auth, no remote database. Guest-first. All copy in English, currency VND.

## Visual direction
- Deep navy primary, white/light neutral surfaces, restrained teal accent, amber for warnings, red for projected negative balances.
- Typography: Manrope (headings) + IBM Plex Sans (body), Plex Mono for figures.
- Consistent radii, borders, focus rings (visible teal ring), buttons, inputs, cards, tables, chart tokens.
- Responsive: desktop sidebar/top nav, collapsible mobile menu.

## Routes (each with its own title/description/OG meta)
1. `/` Home — product intro, how it works (3 steps), what the tool does and does not do, CTA to start. No testimonials or partners.
2. `/simulate/input` — Financial Profile & Scenario Setup: sectioned form layout (income, fixed expenses, variable expenses, savings/debts, scenario settings) with labelled VND inputs. Inputs are UI-only; a notice states calculations come in a later phase.
3. `/simulate/dashboard` — Risk Dashboard: KPI card slots, projected balance chart area, risk table — all showing empty states ("Complete your profile to run a simulation").
4. `/simulate/action-plan` — Action Plan & Report: recommended actions list, report summary and export area — empty states only; AI explanations marked "not yet available".

Shared layout: header with logo + nav, step progress indicator across the three simulate pages, footer with disclaimer (not financial advice).

## Technical details
- `src/styles.css`: oklch tokens incl. `--success`/teal, `--warning`, `--negative`, chart colors; fonts linked in `__root.tsx`.
- `src/components/layout/` AppHeader, AppFooter, SimulateStepper, PageHeader.
- `src/components/ui/` Button, Card, Input (currency), Label, EmptyState, StatCard, simple Table.
- `src/types/finance.ts` (profile/scenario types), `src/lib/format.ts` (VND formatter), `src/lib/engine/` placeholder module with no fabricated results, `src/services/` placeholder.
- Routes: `index.tsx`, `simulate.tsx` (layout with `<Outlet/>` + stepper), `simulate.input.tsx`, `simulate.dashboard.tsx`, `simulate.action-plan.tsx`; `/simulate` redirects to input.
- Install `recharts` (chart frame only, empty-state until engine exists).
- Verify all four routes render via Playwright; report files, routes, remaining work. GitHub sync is automatic if connected.
