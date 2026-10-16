# SafeFlow AI — Deployment Guide

> **Read this file before** adding dependencies, changing framework/build configuration, or writing any server-side code.

Audit date: 2026-10-16 (updated with official-doc and Wrangler dry-run checks). Verified items are marked **[verified]**; everything else is **[unverified]**.

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

## 2. Deployment paths (verified 2026-10-16)

There are two different things that are easy to confuse:

| Path | What it is | Status for this repo |
| --- | --- | --- |
| **A. Lovable Publish** | Lovable's own managed hosting. Lovable docs do not say it runs on *your* Cloudflare account, and the Cloudflare connector does not deploy apps ([Lovable hosting](https://docs.lovable.dev/features/hosting), [Cloudflare API connector](https://docs.lovable.dev/integrations/cloudflare-api)). | **Recommended.** Works with the current setup, no changes needed. |
| **B. Self-deploy to your Cloudflare Workers account** | You run Wrangler yourself against your own account. | Possible with the current Nitro output (dry-run passed, see below). Not the officially documented route. |

**Nitro preset vs Cloudflare Vite plugin**
- *Current setup:* `@lovable.dev/vite-tanstack-config` 2.26.5 runs Nitro 3.0.260603-**beta** with its `cloudflare` preset at build time. It produces `dist/server/index.mjs` and a generated `dist/server/wrangler.json` (`no_bundle: true`, `ASSETS` → `../client`, no `compatibility_flags`). Dev runs in Node/Vite, not workerd.
- *Officially documented route:* Cloudflare's and TanStack's guides tell you to add `@cloudflare/vite-plugin` + `wrangler` and a root `wrangler.jsonc` (`main: @tanstack/react-start/server-entry`, `nodejs_compat`). Dev and preview then run inside workerd ([Cloudflare TanStack Start guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/), [TanStack hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting), [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/)).
- TanStack lists Nitro as a separate generic hosting option. **[unverified]** No official doc found that names Nitro 3 beta + this TanStack version as a supported Cloudflare combination. Treat path B as working but unofficial.
- Do **not** switch to the Vite plugin without approval. It would replace the Lovable config's Nitro step and could break Lovable Publish.

## 3. Build & bundle size

- Build: `npm run build` (`vite build`). Output: `dist/server/` (Worker) and `dist/client/` (assets + `_headers`).
- **Wrangler dry-run [verified]:** temporary `npx wrangler@latest deploy --dry-run -c dist/server/wrangler.json`, run on a copy of `dist/`, no deploy, project dependencies unchanged.
  - Result: **Total Upload 4,394.90 KiB / gzip 945.57 KiB**, 25 static asset files, only binding `ASSETS`.
- **Limit:** since Sep 4, 2026 Cloudflare checks only the uncompressed size, **64 MiB on Free and Paid** (the old 3 MB/10 MB compressed caps were removed) ([limits](https://developers.cloudflare.com/workers/platform/limits/), [changelog](https://developers.cloudflare.com/changelog/post/2026-09-04-increased-worker-size-limit/)). Current usage is about 7% of that limit.
- Also relevant: Free plan allows 10 ms CPU per request and 100,000 requests/day. Waiting on Groq's `fetch` does not count as CPU. SSR CPU time has **not** been measured.
- Never set `ssr.external` / `resolve.external`; all packages must be bundled.

## 4. Secrets (Groq)

- `GROQ_API_KEY` is read **only** inside the `.handler()` of `explainWithGroq` (`src/lib/ai/groq.ts`).
- Lovable: set it in **Project Settings → Secrets** (`.env` is not read). Self-deploy: `wrangler secret put GROQ_API_KEY`.
- Never use a `VITE_` prefix, never read it at module scope, never return or log it. Errors returned to the browser are generic.

### 4a. Public AI endpoint risk (not yet fixed)

`explainWithGroq` is a public POST endpoint. CSRF middleware blocks cross-site *browser* requests, but scripts can still call it directly. Risks:
- **Quota/cost exhaustion:** each call can use up to ~8,000 characters of input + up to 650 output tokens on your Groq key. Nothing limits calls per visitor.
- **Free-relay misuse:** `context` is free text, so it can be used as a general-purpose chatbot through your key. The system prompt limits this, but only partly.
- **Worker request quota:** heavy abuse also uses up your request allowance (100k/day on the Workers Free plan if self-deployed).

**Minimal protection recommended for a public MVP (no auth, no database):**
1. Lower the limit on `context` length and add a short server-side check that the context looks like SafeFlow's generated summary.
2. Set a hard monthly spend/usage limit in the Groq dashboard. This is the real backstop.
3. Per-IP rate limiting at the edge: for path B, Cloudflare WAF rate-limiting rules or the Workers Rate Limiting binding. For path A, there is no built-in limiter, so items 1–2 are the main protection.
4. Optional: Cloudflare Turnstile on the AI buttons (path B only).

**Publishing advice:** don't publish widely with the AI buttons enabled until **at least items 1 and 2** are done. A private or demo share is lower risk.

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

- Public Groq endpoint has no limit (see 4a). **Blocker for wide release.**
- Nitro 3 is a beta. Path B is not the officially documented Cloudflare route.
- Lovable Publish's underlying infrastructure is not documented as your Cloudflare account. Cloudflare dashboards and limits apply only to path B.
- Not yet verified: a live Groq call from a deployed build, and SSR CPU time against the 10 ms Free limit.

## 9. Rules for future Lovable / Bolt.new tasks

1. Read `DEPLOYMENT.md` before adding dependencies, changing configuration, or writing server code.
2. Keep all existing features and business logic working.
3. Keep Groq credentials server-side; never hardcode or expose secrets.
4. Avoid runtime APIs or dependencies that don't work on Cloudflare Workers.
5. Don't change deployment architecture or platform without explicit approval.
6. If a change may affect deployment, explain the risk and verify compatibility first.
