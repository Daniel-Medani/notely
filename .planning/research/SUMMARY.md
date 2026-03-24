# Project Research Summary

**Project:** Notely
**Domain:** Block-based productivity app (Notion-like), multi-tenant SaaS, App Router
**Researched:** 2026-03-24
**Confidence:** HIGH

## Executive Summary

Notely is a Notion-like block-based productivity app built as a free-tier hosted multi-tenant SaaS. Research confirms this is a well-understood product category with established patterns: a layered architecture (proxy → Server Actions → Service → Repository), a ProseMirror-based rich-text editor (TipTap), and path-based multi-tenancy on Vercel's hobby plan. The recommended stack centers on Next.js 16 with App Router and Server Actions, Prisma 7 + Neon PostgreSQL, Better Auth (replacing the perpetually-beta next-auth v5), and TipTap 3 with TanStack Query 5 for optimistic UI. All core dependencies have verified stable releases as of March 2026 and are free-tier compatible.

The competitive position is clear: most free-tier Notion alternatives are either single-user or self-hosted. Notely's differentiator is a free hosted product with multi-tenant org support, email invitations, and role-based access — a combination none of the leading free alternatives offer. This narrows the required feature set considerably: the entire database views / real-time collaboration / AI surface should be deferred to v2+ so the team can ship a high-quality core without infrastructure cost overruns.

The primary risks are security-structural (cross-tenant data leaks, unauthenticated Server Action access) and data integrity (TipTap schema evolution silently dropping content, debounce-save losing edits on tab close). Every one of these is preventable if addressed at the correct phase — specifically, the repository layer must enforce `organizationId` scoping from day one, and the editor must be wired for `beforeunload` flush before any user-facing content is accepted. Deviating from the prescribed architectural patterns (e.g., using `strategy: "database"` sessions, integer ordering for the page tree, or `middleware.ts` instead of `proxy.ts`) will compound difficulty non-linearly.

---

## Key Findings

### Recommended Stack

The stack is modern and tightly integrated. Next.js 16 with App Router eliminates the need for a separate API layer — Server Actions replace REST endpoints for all mutations. Prisma 7 (now Rust-free for faster cold starts) connects to Neon via the `@prisma/adapter-neon` WebSocket driver, which is mandatory on Vercel serverless to prevent connection exhaustion. Better Auth provides first-class Prisma adapter support and built-in org/member/role primitives, removing the need for custom auth infrastructure that next-auth v5 still cannot provide in stable form.

See full details: `.planning/research/STACK.md`

**Core technologies:**
- **Next.js 16.2.1** — full-stack framework; App Router + Server Actions replace separate API layer
- **Better Auth (latest)** — auth with Prisma adapter + org support; next-auth v5 is perpetually beta, avoid
- **Prisma 7.5.0 + `@prisma/adapter-neon`** — type-safe DB access; adapter is required for Vercel serverless
- **Neon PostgreSQL (free tier)** — 0.5 GB / 100 CU-hours/month; scale-to-zero fits Vercel hobby plan
- **TipTap 3.20.5** — ProseMirror-based block editor; headless, extensible, ships Notion-like template
- **TanStack Query 5.95.2** — optimistic updates on page tree; not needed for editor (debounce handles that)
- **Tailwind CSS 4.x + shadcn/ui** — zero-config CSS; components updated for React 19
- **Zod 4.3.6** — single schema shared between Server Action server-side validation and React Hook Form

**Critical version constraints:**
- Next.js 16 uses `proxy.ts` / `export function proxy()` — NOT `middleware.ts`
- Prisma 7 requires `@prisma/adapter-neon`; without it connections exhaust on cold starts
- Auth.js sessions must use `strategy: "jwt"` — database sessions break Edge runtime
- Upstash Redis is required for rate limiting (in-memory breaks on stateless Vercel invocations)

### Expected Features

Research confirms a clear v1 scope with well-understood user expectations. The `/`-command block insertion, drag handles, and debounce auto-save are table stakes — their absence makes the product feel unfinished, not merely incomplete. Page emoji icons and breadcrumbs are low-effort, high-visibility additions that should ship with v1 based on competitor analysis.

See full details: `.planning/research/FEATURES.md`

**Must have (table stakes — P1):**
- Authentication (email/password + Google OAuth) — no authenticated product without it
- Auto-create personal org on signup — zero-friction onboarding prevents blank-screen abandon
- Hierarchical page tree with optimistic sidebar operations (create, rename, delete, move)
- Block-based editor: headings, lists, to-do, code with syntax highlighting, blockquote, divider, image URL embed
- Slash command (`/`) insertion — absence is immediately jarring to any Notion-aware user
- Drag-and-drop block reordering — expected; absence makes editor feel primitive
- Debounce auto-save — users must never manually save
- Full-text search — content is useless if it cannot be found
- Trash / soft delete with recovery — accidental deletes cause product abandonment
- Dark mode, page emoji icons, breadcrumbs — expected in 2026; low implementation cost

**Should have (competitive differentiators — P1 with org features):**
- Multi-tenant org management with path-based routing (`/[org]/...`)
- Role-based membership (Admin / Member)
- Email invitations via Resend
- Rate limiting on auth and write endpoints

**Defer (v1.x):**
- Inline page links (`@page-name` mention)
- Page cover images (URL-based)
- Block context menu for type transforms
- Responsive layout / PWA manifest

**Defer (v2+):**
- Database views (table, kanban, calendar) — effectively a product inside a product
- Real-time collaboration (Yjs/CRDT/Liveblocks) — infrastructure cost prohibitive
- AI features — API costs incompatible with free-tier constraints
- Page-level permissions / public sharing
- Native mobile app

### Architecture Approach

The architecture is a strict layered monolith: `proxy.ts` (auth + org guard at edge) → Server Components (initial renders) → Server Actions (all mutations) → Service layer (business logic, testable with mock repos) → Repository layer (Prisma, always scoped by `organizationId`) → Neon PostgreSQL. Client state is managed by TanStack Query for the page tree (optimistic updates) and TipTap's local state for the editor (debounce save). The feature-vertical folder structure (`src/features/{auth,orgs,pages,editor,search}/`) keeps cross-feature coupling explicit and avoidable.

See full details: `.planning/research/ARCHITECTURE.md`

**Major components:**
1. **`proxy.ts`** — validates session + org membership before any Server Component runs; must use `auth.config.ts` (no Prisma) at edge
2. **Service layer** — all business logic, authorization checks; testable in Vitest with mock IRepository implementations
3. **PrismaRepository (per feature)** — every method requires `organizationId`; no exception; prevents cross-tenant leaks without RLS
4. **TanStack Query hooks** — optimistic page-tree mutations; always invalidate in `onSettled`, never only `onSuccess`
5. **TipTap editor** — `"use client"` only; `onUpdate` → `useDebouncedSave` → Server Action; store `editor.getJSON()`, never `getHTML()`
6. **Search (PostgreSQL FTS)** — `tsvector` GIN index via trigger (not generated column); hybrid Prisma migration approach mandatory

**Key architectural rules:**
- Server Actions are thin: Zod parse → get session → call service → return typed result
- Services are never imported in `"use client"` components — only via TanStack Query `mutationFn`
- `organizationId` is always derived from the server-side session, never from client input
- Page tree uses adjacency list with `Float` fractional ordering (not `Int`) from the start

### Critical Pitfalls

Research identified 12 concrete pitfalls. The following 5 represent the highest recovery cost or the easiest to introduce accidentally.

See full details: `.planning/research/PITFALLS.md`

1. **Server Actions are public HTTP endpoints** — every action must independently call `auth()` and verify org membership + resource ownership; a centralized `createAction()` wrapper makes this structural rather than opt-in
2. **Cross-tenant data leak via missing `organizationId` filter** — a single missed filter in any repository method is a critical security incident; enforce at the interface level and write two-tenant integration tests for every resource type
3. **Debounce-save loses content on tab close** — add `beforeunload` flush using `navigator.sendBeacon()` with `keepalive: true`; show "Saving..." / "Saved" indicator; this is a 5-line fix that prevents complete user trust erosion
4. **TipTap link extension allows `javascript:` XSS** — configure with `protocols: ['http', 'https', 'mailto']` and `validate: href => /^https?:\/\//.test(href)`; sanitize stored JSON via DOMPurify in non-editor render contexts
5. **Auth.js `strategy: "database"` breaks Edge runtime** — use `strategy: "jwt"` always; the Prisma adapter cannot run at the Edge; this silently breaks all route protection if wrong

---

## Implications for Roadmap

The feature dependency chain (Auth → Org → Page Tree → Editor → Search) maps directly to a linear phase structure. No phase can be safely parallelized — each depends on the previous being stable. The architecture research provides a concrete build order that matches this dependency chain. Suggested 7-phase structure:

### Phase 1: Foundation and Infrastructure

**Rationale:** Every feature depends on the DB schema, Prisma setup, auth, and tenant routing being correct. Security pitfalls 1 and 2 (unguarded Server Actions, missing `organizationId` scoping) must be addressed structurally before any feature code is written — retroactively adding them causes missed queries and likely a data leak.

**Delivers:** Neon + Prisma schema (`users`, `organizations`, `memberships`, `pages`, `invitations` tables), Better Auth with email/password + Google OAuth, `proxy.ts` tenant guard, personal org auto-create on signup, `createAction()` wrapper enforcing auth by default, `DATABASE_URL` pooled + `DIRECT_URL` direct connection strings configured

**Features addressed:** Authentication, auto-create personal org

**Pitfalls to avoid:** Unguarded Server Actions (P1), cross-tenant leak (P2), Neon cold start timeouts (P7), Auth.js database sessions breaking Edge (P11)

**Research flag:** Standard patterns — well-documented; no additional research needed for this phase

---

### Phase 2: Page Tree and Sidebar

**Rationale:** Pages are the core organizational model. The optimistic sidebar CRUD must be stable before the editor has anywhere to write content. Page tree ordering must use `Float` fractional indexing from the very first migration — changing it later requires a data migration.

**Delivers:** Hierarchical page sidebar (adjacency list, fractional ordering), optimistic create/rename/delete/move via TanStack Query, `usePageTree` hook with correct `onSettled` invalidation, breadcrumbs in header, page emoji icons

**Features addressed:** Hierarchical pages, sidebar navigation, page CRUD, page emoji icon, breadcrumbs

**Pitfalls to avoid:** Integer ordering requiring mass rewrite on reorder (P9), TanStack Query stale data after mutations (P8), cache key mismatch across query keys (P12), recursive CTE depth limit (P10)

**Research flag:** Standard patterns — TanStack Query optimistic update pattern is well-documented; no additional research needed

---

### Phase 3: Block Editor

**Rationale:** The editor is the core product experience. TipTap's extension set must be locked before any content is written to the database — extension changes after content exists require content migration scripts (schema evolution pitfall). The debounce-save and `beforeunload` flush must ship together, not as a follow-up.

**Delivers:** TipTap editor with full v1 block set (headings, lists, to-do, code with syntax highlighting, blockquote, divider, image URL embed), slash command insertion, drag-and-drop block reordering, debounce auto-save with `beforeunload` flush, "Saving..." / "Saved" indicator, link extension with `javascript:` XSS prevention

**Features addressed:** Block editor, slash commands, drag-and-drop reordering, debounce auto-save

**Pitfalls to avoid:** TipTap link XSS (P3), TipTap schema evolution dropping content (P4), debounce-save losing content on tab close (P5), saving raw HTML instead of JSON (architecture anti-pattern 2)

**Research flag:** TipTap DragHandle + Slash Commands extensions need verification of v3.20.5 API surface — recommend `/gsd:research-phase` before implementation

---

### Phase 4: Search

**Rationale:** Content created in Phase 3 must be findable. PostgreSQL full-text search with a GIN index requires a non-trivial migration approach (trigger-based `tsvector` updates to avoid Prisma migration drift) — this must be planned before the migration is written, not after.

**Delivers:** PostgreSQL FTS via `tsvector` + GIN index (trigger-based, Prisma-safe), SearchModal with keyboard shortcut (Cmd+K), search scoped to current org

**Features addressed:** Full-text search

**Pitfalls to avoid:** GIN index dropped by Prisma migration (P6), search missing org scope (security)

**Research flag:** The hybrid Prisma migration approach for `tsvector` columns is well-documented in the pitfalls file — no additional research needed, but implementation requires careful adherence to the prescribed steps

---

### Phase 5: Org Management and Invitations

**Rationale:** Org features depend on auth being stable (Phase 1) but do not depend on the editor. Placing invitations after search avoids shipping an email flow before there is content for invited members to view.

**Delivers:** Org settings page, member list with roles (Admin / Member), email invitation flow via Resend, invitation pending badge, member removal, invitation rate limiting (Upstash, 100 emails/day limit awareness)

**Features addressed:** Org management, role-based access, email invitations

**Pitfalls to avoid:** Invitation email burst exhausting Resend free tier (100/day), missing role enforcement in Server Actions

**Research flag:** Standard patterns — Resend SDK and Better Auth org APIs are well-documented; no additional research needed

---

### Phase 6: Trash and Soft Delete

**Rationale:** Trash depends on all page CRUD being stable. Implementing it after the editor ensures soft-delete covers both tree operations and content. The `deletedAt` filter must be applied uniformly across all page queries.

**Delivers:** Soft delete with `deletedAt` timestamp, TrashDrawer component, restore + permanent delete operations, `deletedAt: null` filter enforced on all sidebar/search queries

**Features addressed:** Trash / soft delete with recovery

**Pitfalls to avoid:** Soft-deleted pages leaking into search results (security), restore leaving orphaned children

**Research flag:** Standard patterns — no additional research needed

---

### Phase 7: Polish, Rate Limiting, and CI/CD Hardening

**Rationale:** Rate limiting should be validated against live features before this phase but applied systematically at the end. Dark mode is theme-only and does not affect any feature. E2E suite must cover all mutation types verified in prior phases.

**Delivers:** System-aware dark mode (next-themes), Upstash rate limiting on all auth + write Server Actions, full Vitest unit/integration test coverage, full Playwright E2E suite (auth, page CRUD, search, trash recovery), two-tenant cross-isolation integration tests, CI/CD pipeline (lint-typecheck + test + e2e checks)

**Features addressed:** Dark mode, rate limiting, CI/CD

**Pitfalls to avoid:** Rate limiting only on login (must cover all auth + write endpoints), content rendered outside editor without DOMPurify sanitization

**Research flag:** Standard patterns — GitHub Actions CI is well-documented; no additional research needed

---

### Phase Ordering Rationale

- **Auth before everything:** Server Actions and org-scoped repositories cannot be safely built without the auth wrapper pattern established first. Retroactively adding auth to existing actions is error-prone.
- **Page tree before editor:** The editor requires a page to exist and a save Server Action to target. Building the editor without a stable page model creates integration instability.
- **Editor before search:** Full-text search indexes page content — content only exists after the editor writes to the DB.
- **Org management after search:** Invited members need something to look at. Shipping invitations into an empty product reduces the value of the org feature.
- **Trash after editor:** Soft delete semantics must be consistent across sidebar (already done in Phase 2) and search (Phase 4). Phase 6 adds the UI and recovery flow after all consumers of the delete flag are stable.
- **Polish last:** Rate limiting and dark mode do not unblock any feature; doing them last avoids scope creep in earlier phases.

### Research Flags

Phases requiring `/gsd:research-phase` during planning:
- **Phase 3 (Editor):** TipTap DragHandle and Slash Commands extension API surface at v3.20.5 needs verification before writing extension configuration code. The Drag Context Menu component in particular has limited documentation examples for the current version.

Phases with standard, well-documented patterns (skip research-phase):
- **Phase 1 (Foundation):** Better Auth + Prisma + Next.js 16 integration is thoroughly documented in official Prisma docs and Better Auth guides
- **Phase 2 (Page Tree):** TanStack Query optimistic update pattern is canonical and documented extensively
- **Phase 4 (Search):** The Prisma + `tsvector` hybrid migration approach is fully described in PITFALLS.md with source links
- **Phase 5 (Org/Invitations):** Resend SDK and Better Auth org APIs are stable and well-documented
- **Phase 6 (Trash):** Standard soft-delete pattern, no novel integrations
- **Phase 7 (Polish/CI):** GitHub Actions CI and Upstash rate limiting are standard

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against GitHub releases and official docs as of 2026-03-24; version compatibility table confirmed |
| Features | HIGH | Corroborated by Notion official docs, competitor analysis (AppFlowy, AFFiNE, Outline), and user review research |
| Architecture | HIGH | Patterns drawn from official Next.js, TanStack, Auth.js, and TipTap documentation; confirmed against known upstream issues |
| Pitfalls | HIGH | Multiple authoritative sources including official CVEs, GitHub issues, and official security docs; no single-source findings in top pitfalls |

**Overall confidence:** HIGH

### Gaps to Address

- **TipTap v3 DragHandle exact API:** The drag handle and slash command extension docs were consulted at a high level; implementation-level API parameters (event signatures, configuration options) should be verified against `@tiptap/extension-drag-handle` source during Phase 3 planning.
- **Better Auth org slug behavior:** The exact slug generation and uniqueness enforcement behavior for organization slugs needs to be confirmed against Better Auth source code before writing the org creation flow — the docs describe the feature but not edge cases (duplicate slugs, special characters).
- **Neon free-tier compute scale-to-zero timing:** The 5-minute inactivity threshold for scale-to-zero is documented but may vary. The `connect_timeout=15` recommendation should be validated in staging against actual Neon cold start durations before launch.
- **Fractional indexing library choice:** PITFALLS.md recommends fractional indexing for page ordering but does not specify a library. Evaluate `fractional-indexing` (npm) vs. a custom implementation during Phase 2 planning.

---

## Sources

### Primary (HIGH confidence)

- [Next.js 16.2.1 releases — GitHub](https://github.com/vercel/next.js/releases) — version confirmation, proxy.ts pattern
- [TipTap 3.20.5 releases — GitHub](https://github.com/ueberdosis/tiptap/releases) — version confirmation, extension availability
- [Prisma 7.5.0 releases — GitHub](https://github.com/prisma/prisma/releases) — version, adapter requirements
- [Better Auth + Next.js + Prisma — Prisma Docs](https://www.prisma.io/docs/guides/betterauth-nextjs) — official integration guide
- [Auth.js is now part of Better Auth — GitHub Discussion #13252](https://github.com/nextauthjs/next-auth/discussions/13252) — confirms next-auth v5 should not be used for new projects
- [TanStack Query v5 optimistic updates — official docs](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates) — optimistic page tree pattern
- [Neon plans — Neon Docs](https://neon.com/docs/introduction/plans) — free tier constraints
- [Next.js Multi-Tenant Guide — official docs](https://nextjs.org/docs/app/guides/multi-tenant) — path-based tenancy pattern
- [TipTap SSR Hydration Issue #5856](https://github.com/ueberdosis/tiptap/issues/5856) — `immediatelyRender: false` requirement confirmed
- [Next.js Server Actions Security — MakerKit](https://makerkit.dev/blog/tutorials/secure-nextjs-server-actions) — action security patterns
- [Potential XSS in TipTap link extension — GitHub Issue #3673](https://github.com/ueberdosis/tiptap/issues/3673) — link XSS pitfall sourced from issue tracker
- [Connect from Prisma to Neon — Neon Official Docs](https://neon.com/docs/guides/prisma) — connection string configuration
- [Auth.js Migrating to v5 — authjs.dev](https://authjs.dev/getting-started/migrating-to-v5) — JWT strategy requirement

### Secondary (MEDIUM confidence)

- [Bulletproof FTS in Prisma with PostgreSQL tsvector — Medium](https://medium.com/@chauhananubhav16/bulletproof-full-text-search-fts-in-prisma-with-postgresql-tsvector-without-migration-drift-c421f63aaab3) — hybrid migration approach for GIN index
- [Fractional Indexing for Reordering — hollos.dev](https://hollos.dev/blog/fractional-indexing-a-solution-to-sorting/) — ordering strategy
- [Concurrent Optimistic Updates in React Query — tkdodo.eu](https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query) — TanStack Query key invalidation patterns
- [Notion's Block-Based Data Model — Notion Engineering Blog](https://www.notion.com/blog/data-model-behind-notion) — adjacency list page structure
- [Preventing Cross-Tenant Data Leakage — agnitestudio.com](https://agnitestudio.com/blog/preventing-cross-tenant-leakage/) — multi-tenant security patterns

---

*Research completed: 2026-03-24*
*Ready for roadmap: yes*
