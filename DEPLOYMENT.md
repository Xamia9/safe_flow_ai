# SafeFlow AI — Deployment Guide

> **Read this file before** adding dependencies, changing framework/build configuration, or writing any server-side code.

Audit date: 2026-10-16. Verified items are marked **[verified]**; everything else is **[unverified]**.

## 1. Current stack [verified from package.json / lockfile]

| Part | Version |
| --- | --- |
| TanStack Start | `@tanstack/react-start` 1.168.60 |
| TanStack Router | `@tanstack/react-router` 1.170.41, `@tanstack/router-plugin` 1.168.42 |
| Nitro (deploy plugin) | `nitro` 3.0.260603-beta (beta release) |
| Vite | 8.1.5 (wrapped by `@lovable.dev/vite-tanstack-config` 2.26.5) |
| React | ^19.2.0 |
| TypeScript | ^5.8.3 |
| Tests | Vitest ^4.1.10 + jsdom |

Architecture:
- File-based routes in `src/routes/` (`/`, `/simulate`, `/simulate/input`, `/simulate/dashboard`, `/simulate/action-plan`). No `src/routes/api/` server routes.
- One server function: `explainWithGroq` in `src/lib/ai/groq.ts` (`createServerFn`, POST). It calls Groq with `fetch` only.
- `src/server.ts` is the custom server entry (SSR error wrapper); `src/start.ts` adds error + CSRF middleware.
- Financial math is pure TypeScript in `src/lib/` and runs in the browser.
- Guest state lives in browser `localStorage` (`src/services/simulationStore.ts`). No database is used at runtime. (`supabase/migrations/` contains one unused schema file; nothing imports a database client.)
- PDF export (jsPDF) runs client-side only.
- Leftover Gemini helpers (`src/lib/gemini.*`) are not used by the UI.

## 2. Target platform: Cloudflare Workers [recommended]

**Verdict: compatible as-is.** No migration or adapter change required.

Evidence:
- The Lovable Vite config enables Nitro with its Cloudflare preset by default **[verified: `nitro/dist/presets/cloudflare` present; build log]**.
- `vite build` succeeded on 2026-10-16 and produced **[verified]**:
  - `dist/server/index.mjs` (Worker entry, ES module)
  - `dist/server/wrangler.json` (`main: index.mjs`, assets binding `ASSETS` → `../client`, `no_bundle: true`)
  - `dist/client/` static assets + `_headers`
- No Node built-ins (`fs`, `path`, `child_process`, `node:*`) are imported in `src/` **[verified by search]**.
- Browser APIs (`window`, `localStorage`, `matchMedia`) are used only inside effects/handlers **[verified by search; SSR behavior verified by working preview]**.
- The Groq call uses standard `fetch` + `AbortController`, both native to Workers.
- `GROQ_API_KEY` does not appear in `dist/client` **[verified by search]**.

Lovable's own Publish button deploys this same Worker build. That is the simplest path; self-deploying with Wrangler is also possible (`npx nitro deploy --prebuilt` or `wrangler deploy -c dist/server/wrangler.json`) **[unverified — not run]**.

Alternatives were not needed, since Workers fits.

## 3. Build & deploy facts

- Build command: `npm run build` (`vite build`).
- Output: `dist/server/` (Worker) + `dist/client/` (static assets).
- Do **not** set `ssr.external` / `resolve.external`; every package must be bundled.
- Generated `compatibility_flags` is empty (no `nodejs_compat`). Current code doesn't need it. Adding Node-dependent packages would.
- Server bundle is ~4.4 MB uncompressed. Cloudflare's compressed Worker size limits differ between Free and Paid plans. Check current limits before deploying. **[unverified]**

## 4. Secrets (Groq)

- `GROQ_API_KEY` is read **only** inside the `.handler()` of `explainWithGroq` via `process.env["GROQ_API_KEY"]`.
- On Lovable: set it in **Project Settings → Secrets** (`.env` is not read). On self-hosted Cloudflare: `wrangler secret put GROQ_API_KEY`.
- Never prefix it with `VITE_`, never read it at module scope, never return it or log it.
- `.env.example` holds only a placeholder.

## 5. Must remain compatible

- Server code: only Web-standard APIs (`fetch`, `Request`, `Response`, `crypto.subtle`, `AbortController`).
- No module-scope `Math.random()`, `crypto.randomUUID()`, timers or I/O (Workers forbid these in global scope).
- No `*.client.*` filenames in SSR-reachable code.
- Browser globals only in `useEffect`, event handlers, or `<ClientOnly>`.

## 6. Do NOT introduce without a compatibility review

- Packages that need `fs`, `net`, `child_process`, native addons, or runtime file paths (e.g. Puppeteer, sharp, Prisma's Node engine, `pg` over TCP).
- Long-running/background servers, websockets servers, or local file storage.
- Changes to `vite.config.ts`, Nitro preset, `src/server.ts`, or `src/start.ts`.
- A different framework or hosting platform (needs explicit owner approval).
- Server routes under `/api/public/*` without caller verification.

## 7. Pre-deployment checklist

- [ ] `bunx tsgo --noEmit` (or `npx tsc --noEmit`) is clean
- [ ] `npm test` passes
- [ ] `npm run build` succeeds and creates `dist/server/index.mjs` + `wrangler.json`
- [ ] `GROQ_API_KEY` is set in the target environment's secrets
- [ ] No secret strings in `dist/client`
- [ ] After publishing: open every page, run "Explain My Results" and "Generate action plan" on the live site

## 8. Known uncertainties / blockers

- **Public AI endpoint:** `explainWithGroq` has no sign-in or rate limit. Once published, anyone can call it and use your Groq quota.
- Nitro is a **beta** version; upgrades may change output.
- A live Groq request from a deployed Worker has not been verified.
- Worker size against your Cloudflare plan limit has not been verified.
- Groq request timeout is 30 s. Workers wait on outbound fetches without CPU cost, but plan limits are not verified here.

## 9. Rules for future Lovable / Bolt.new tasks

1. Read `DEPLOYMENT.md` before adding dependencies, changing configuration, or writing server code.
2. Keep all existing features and business logic working.
3. Keep Groq credentials server-side; never hardcode or expose secrets.
4. Avoid runtime APIs or dependencies that don't work on Cloudflare Workers.
5. Don't change deployment architecture or platform without explicit approval.
6. If a change may affect deployment, explain the risk and verify compatibility first.
