# Stack Research

**Domain:** Block-based productivity app (Notion-like), multi-tenant SaaS, App Router
**Researched:** 2026-03-24
**Confidence:** HIGH (all versions verified against GitHub releases and official docs)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | **16.2.1** | Full-stack React framework, App Router, Server Actions | Most recent stable. App Router + Server Actions removes the need for a separate API layer for mutations. PPR and Cache Components land in 16. Memory note: uses `proxy.ts` (not `middleware.ts`) in v16. |
| TypeScript | **5.x** (latest via Next.js) | Type safety across the full stack | Non-negotiable for a project using repository patterns and strict domain types. |
| PostgreSQL via Neon | **Free tier** (0.5 GB/project, 100 CU-hours/month) | Primary database, serverless | Scale-to-zero fits Vercel hobby plan. Neon is the official Vercel Postgres replacement since Q4 2024. Free tier never expires. Acquired by Databricks May 2025; pricing dropped significantly, free compute doubled to 100 CU-hours. |
| Prisma ORM | **7.5.0** | Database access, migrations, type-safe queries | v7 is Rust-free (faster cold starts on serverless), generates a lightweight client. `prisma.config.ts` replaces schema-embedded config. Prevents SQL injection by default. The `@prisma/adapter-neon` driver adapter connects Prisma to Neon's serverless WebSocket driver for correct connection pooling on Vercel. |
| Better Auth | **latest** (MIT, open source) | Authentication: email/password, Google OAuth, sessions, organizations | **Recommended over next-auth v5** (see Alternatives). Better Auth has first-class Prisma adapter, built-in org/member/role support, built-in rate limiting, and is actively maintained. The Auth.js team officially joined Better Auth in September 2025; Auth.js v5 remains in beta with no stable release date. |
| TipTap | **3.20.5** | Block-based rich text editor | ProseMirror-based, headless, extensible. Ships a "Notion-like" template. `@tiptap/extension-code-block-lowlight` provides syntax highlighting via `lowlight@^3`. Free core extensions cover all v1 block types. |
| Tailwind CSS | **4.x** (v4.0+ released Jan 22, 2025) | Utility-first CSS | v4 requires zero config file, ~5x faster full builds, ~100x faster incremental. Automatic content detection. shadcn/ui migrated all components to v4 + React 19. |
| shadcn/ui | **latest CLI** (no version — copied components) | UI component library | Not a package — you own the code. Components updated for Tailwind v4 and React 19. Default style is `new-york`. `toast` deprecated in favour of `sonner`. HSL → OKLCH. |
| TanStack Query | **5.95.2** | Server state, caching, background refetch | v5 is ~20% smaller than v4, stable Suspense support, simplified optimistic update API. Use for page-tree operations and search results where optimistic UI is needed. |
| Zod | **4.3.6** | Schema validation (server-side input, form schemas) | v4 is 14x faster string parsing, 57% smaller core. Shared schema pattern: one Zod schema used for both server-side Server Action validation and client-side React Hook Form. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@prisma/adapter-neon` | Match Prisma 7.x | Neon serverless WebSocket adapter | Required — Prisma 7 must use a driver adapter when connecting to Neon on Vercel serverless. Without it, connections exhaust the pool on cold starts. |
| `@neondatabase/serverless` | latest | Neon WebSocket driver | Peer dependency of `@prisma/adapter-neon`. |
| `lowlight` | `^3` | Syntax highlighting engine for TipTap | Used exclusively with `@tiptap/extension-code-block-lowlight`. Load only the languages you need to keep bundle size minimal. |
| `react-hook-form` | **7.60.0** | Client-side form state | Use with `@hookform/resolvers` + Zod. shadcn/ui's `<Form>` components are built on top of it. Only needed for complex multi-field forms; trivial forms can use `useActionState` directly. |
| `@hookform/resolvers` | **5.1.1** | Connects Zod schemas to React Hook Form | Required when using RHF + Zod together. |
| `@upstash/ratelimit` + `@upstash/redis` | latest | Rate limiting for auth + write endpoints | Upstash free tier: 500K commands/month (raised March 2025). Sliding window algorithm. Works in Next.js Server Actions and Route Handlers without persistent Node.js connections. |
| `resend` | latest SDK | Transactional email (invitations, verification) | Free tier: 3,000 emails/month, 100/day, 1 verified domain. Sufficient for v1 invitation and password reset flows. |
| `lucide-react` | **1.0.1** | Icons (shadcn/ui default) | v1.0 cut package size 32% (11.4 MB → 1 MB gzipped). `aria-hidden` defaults to `true`. All brand icons removed in v1. |
| `sonner` | latest | Toast notifications | shadcn/ui deprecated its own `toast` component in favour of Sonner. Used for optimistic update feedback. |
| `next-themes` | latest | System-aware dark mode | Pairs with shadcn/ui's theme toggle. Stores preference in `localStorage`; avoids flash of wrong theme via CSS class injection. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest | **4.1.1** | Unit + integration testing (services, repositories) | v4 adds `aroundEach`/`aroundAll` hooks. Does not support async Server Components — use Playwright for those flows. Run with `--pool=forks` for repository tests using real PostgreSQL. |
| Playwright | **1.58.2** | E2E testing (auth flows, CRUD, search) | Auth flows, page CRUD, and search are the minimum E2E suite. Use `storageState` to persist auth sessions between tests — avoids re-logging in on every spec. |
| Docker Compose | N/A | Local PostgreSQL for repository tests | Run a `postgres:16-alpine` container. Repository tests run against this real DB; services use mock repositories — never cross the boundary. |
| ESLint + Prettier | Latest via Next.js | Code quality + formatting | Next.js 16 ships a default flat ESLint config. Add `eslint-config-prettier` to prevent rule conflicts. |
| GitHub Actions | N/A | CI/CD pipeline | Three required checks: `lint-typecheck`, `test` (Vitest), `e2e` (Playwright). Both `main` and `development` branches require all three to pass before merge. |

---

## Installation

```bash
# Core framework
npx create-next-app@latest notely --typescript --tailwind --app --src-dir --import-alias "@/*"

# Database
npm install prisma @prisma/client @prisma/adapter-neon @neondatabase/serverless
npx prisma init

# Auth
npm install better-auth

# Editor
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit \
  @tiptap/extension-code-block-lowlight lowlight

# UI
npx shadcn@latest init
npm install lucide-react sonner next-themes

# State + forms + validation
npm install @tanstack/react-query zod react-hook-form @hookform/resolvers

# Email
npm install resend

# Rate limiting
npm install @upstash/ratelimit @upstash/redis

# Dev dependencies
npm install -D vitest @vitejs/plugin-react @testing-library/react \
  @testing-library/user-event @playwright/test
npx playwright install
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Better Auth | next-auth v5 (Auth.js) | Only if you already have a v5 app and migration cost outweighs benefits. Do not start new projects on next-auth v5 — it remains in beta with no stable release date; the Auth.js team joined Better Auth in Sept 2025. |
| Prisma 7 | Drizzle ORM | Drizzle is lighter and better for edge runtimes. Prefer Drizzle if you need Edge deployments (Cloudflare Workers). Prisma 7 is Rust-free and works well on Vercel serverless. |
| Neon | Supabase Postgres | Supabase free tier includes 500 MB + built-in Auth + Storage. Use Supabase if you want an integrated BaaS. Neon is the better choice when you want to own your auth layer (as this project does). |
| TipTap | BlockNote | BlockNote is Notion-style out-of-the-box but less extensible. TipTap has a larger ecosystem and gives full control over block rendering. |
| TipTap | Slate | Slate is more flexible but requires more setup. TipTap's ProseMirror foundation is battle-tested at scale. |
| TanStack Query | SWR | SWR is simpler. TanStack Query v5 wins on devtools, prefetching, and Suspense integration. For page-tree optimistic updates, TanStack Query's `useMutation` pattern is cleaner. |
| Tailwind v4 + shadcn/ui | Tailwind v3 + shadcn/ui | Only use v3 if you are maintaining an existing project that hasn't migrated. All new shadcn/ui components default to v4. |
| @upstash/ratelimit | express-rate-limit / custom in-memory | In-memory rate limiting breaks on Vercel because each invocation is stateless. Upstash Redis is the only viable free-tier distributed rate limiter for Vercel serverless. |
| Vitest | Jest | Jest requires heavy babel/transform config with Next.js. Vitest uses Vite natively, has faster HMR during watch, and is the Next.js docs recommendation. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `next-auth@5` (beta) for new projects | Perpetual beta since 2023; Auth.js team officially migrated to Better Auth; no stable release on the horizon. Choosing it today means adopting technical debt with no upside. | `better-auth` |
| `middleware.ts` in Next.js 16 | Next.js 16 replaced middleware with `proxy.ts` / `export function proxy()`. Using `middleware.ts` will silently fail or produce unexpected behavior. | `proxy.ts` |
| Subdomain-based tenant routing | Requires DNS wildcard (`*.notely.app`), which is incompatible with Vercel hobby plan. | Path-based routing (`/[org]/...`) |
| Image upload (S3/Cloudinary) | Storage costs money; Vercel hobby has no persistent storage. All free tiers have bandwidth limits. v1 does not need upload. | URL embed only |
| Real-time multiplayer (Liveblocks, Yjs, PartyKit) | High complexity, additional cost, out of scope for v1. Liveblocks free tier is 3 users. | Defer to v2+ |
| Raw SQL with user input via Prisma `$queryRaw` | Bypasses Prisma's injection protection. Use parameterized queries only. | Prisma typed query methods; if raw SQL is needed, use `$queryRawUnsafe` never — use `$queryRaw` with template literals only. |
| Client-side environment variables for secrets | Any `NEXT_PUBLIC_` prefix exposes values in the browser bundle. Auth secrets, DB URLs, and API keys must never use `NEXT_PUBLIC_`. | Server-only environment variables |
| `tiptap/extension-collaboration` + Yjs | Requires a WebSocket server (Hocuspocus), adds infrastructure cost, and is out of scope for v1. | Single-user local-first TipTap without collaboration extensions |

---

## Stack Patterns by Variant

**For mutations (create page, rename, delete, move):**
- Use Server Actions (not Route Handlers)
- Pattern: Server Action → Service layer → IRepository → PrismaRepository
- TanStack Query `useMutation` wraps Server Actions for optimistic updates on the page tree

**For reads in RSC (server components):**
- Call service methods directly in async Server Components
- No TanStack Query needed for initial server-rendered data
- TanStack Query is for client-side re-fetches, background updates, and optimistic state

**For editor content saves:**
- Debounce-save pattern: TipTap `onUpdate` → debounce 800ms → Server Action
- No optimistic update needed — TipTap's local state is authoritative until save completes
- Use `useTransition` to show saving indicator without blocking the editor

**For form validation:**
- Define one Zod schema per form
- Import same schema in the Server Action (server-side) and React Hook Form (client-side)
- Never duplicate validation logic between client and server

**For rate limiting:**
- Apply `@upstash/ratelimit` at the Server Action level (not proxy/middleware) for auth and write endpoints
- Use sliding window: `new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "10 s") })`

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Next.js 16.2.1 | React 19, TypeScript 5.x | React 18 still works but React 19 is required for new features like `useActionState`. |
| Tailwind CSS 4.x | shadcn/ui (latest), PostCSS 8.x | v4 no longer needs `tailwind.config.js`. Config lives in `globals.css` via `@theme`. |
| Prisma 7.5.0 | `@prisma/adapter-neon` (match minor), Node.js 18+ | `prisma.config.ts` is the new config file. Legacy `schema.prisma` config still works but is deprecated. |
| TipTap 3.20.5 | React 18/19, ProseMirror (bundled) | `@tiptap/pm` is required as a peer dependency in v3. Do not mix TipTap v2 and v3 extensions. |
| TanStack Query 5.95.2 | React 18/19 | v5 requires React 18+. The `QueryClientProvider` must wrap the entire app; place it in a client boundary in the App Router layout. |
| Better Auth (latest) | Next.js 14+, Prisma 7.x, React 19 | Official Prisma adapter is `@better-auth/prisma-adapter`. Official Next.js integration uses a route handler at `app/api/auth/[...all]/route.ts`. |
| Vitest 4.1.1 | Node.js 18+, Vite 6.x | Does NOT support async Server Components — test those via Playwright E2E instead. |
| Playwright 1.58.2 | Node.js 18+, all major browsers | `storageState` for session reuse is critical to avoid re-login on every test. |
| Zod 4.3.6 | TypeScript 5.x | Zod v4 has a new `z.iso` namespace and changed some method names. Check migration guide when upgrading from v3. |

---

## Free Tier Summary

| Service | Free Limit | Hard Constraint for v1 |
|---------|------------|------------------------|
| Vercel Hobby | 100 GB bandwidth, 150K function invocations/month | No commercial use; personal projects only |
| Neon PostgreSQL | 0.5 GB storage, 100 CU-hours/month | Schema must be lean; large page content stored as JSON (not separate rows) |
| Resend | 3,000 emails/month, 100/day, 1 domain | Sufficient for invitations + password resets at v1 scale |
| Upstash Redis | 500K commands/month | One database; use namespaced keys if multiple rate limit contexts are needed |
| Better Auth | MIT open source, self-hosted | No external call charges; runs entirely within your app |
| GitHub Actions | 2,000 minutes/month (public repo: unlimited) | Keep CI fast: lint+typecheck < 2 min, unit tests < 3 min, E2E < 10 min |

---

## Sources

- [Next.js releases — GitHub](https://github.com/vercel/next.js/releases) — v16.2.1 confirmed latest stable, March 20, 2025
- [TipTap releases — GitHub](https://github.com/ueberdosis/tiptap/releases) — v3.20.5 confirmed latest, March 24, 2025
- [Prisma releases — GitHub](https://github.com/prisma/prisma/releases) — v7.5.0 confirmed latest stable, March 11, 2025
- [TanStack Query releases — GitHub](https://github.com/TanStack/query/releases) — v5.95.2 latest, March 23, 2025
- [Vitest releases — GitHub](https://github.com/vitest-dev/vitest/releases) — v4.1.1 latest stable, March 23, 2025
- [Playwright releases — GitHub](https://github.com/microsoft/playwright/releases) — v1.58.2 latest stable, February 6, 2025
- [Tailwind CSS v4.0 announcement](https://tailwindcss.com/blog/tailwindcss-v4) — Released January 22, 2025
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — All components updated for Tailwind v4 + React 19
- [Auth.js is now part of Better Auth — GitHub Discussion](https://github.com/nextauthjs/next-auth/discussions/13252) — September 2025 announcement
- [NextAuth v5 beta status — GitHub Discussion](https://github.com/nextauthjs/next-auth/discussions/13382) — Confirmed v5 has no stable release timeline
- [Better Auth + Next.js + Prisma — Prisma Docs](https://www.prisma.io/docs/guides/betterauth-nextjs) — Official integration guide
- [Neon plans — Neon Docs](https://neon.com/docs/introduction/plans) — Free tier: 0.5 GB, 100 CU-hours/month
- [Resend account quotas](https://resend.com/docs/knowledge-base/account-quotas-and-limits) — 3,000/month, 100/day free
- [Upstash Redis pricing](https://upstash.com/pricing/redis) — 500K commands/month free (updated March 2025)
- [Vercel Hobby plan](https://vercel.com/docs/plans/hobby) — 100 GB bandwidth, 150K invocations/month
- [Zod v4 release notes](https://zod.dev/v4) — v4.3.6 latest, 14x faster, 57% smaller
- [lucide-react v1.0 — Lucide](https://lucide.dev/guide/version-1) — v1.0.1 latest, 32% size reduction

---

*Stack research for: Notely (block-based productivity app, multi-tenant, App Router)*
*Researched: 2026-03-24*
