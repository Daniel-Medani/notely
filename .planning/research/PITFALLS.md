# Pitfalls Research

**Domain:** Notion-like block-based productivity app (Next.js App Router + TipTap + Prisma + Auth.js + PostgreSQL)
**Researched:** 2026-03-24
**Confidence:** HIGH (multiple authoritative sources, official docs, known CVEs)

---

## Critical Pitfalls

### Pitfall 1: Server Actions Treated as Internal — Not as Public HTTP Endpoints

**What goes wrong:**
Developers call a Server Action from a page that already requires authentication and assume the action inherits that protection. The action itself is a public HTTP endpoint — anyone can POST to it directly. Authentication and ownership checks are missing from the action body, so an attacker can delete or modify any record by hitting the action endpoint with arbitrary IDs.

**Why it happens:**
Server Actions look like plain TypeScript functions, which creates the illusion that they execute within the authenticated context they were called from. There is no Next.js runtime enforcement — the developer must add every check explicitly.

**How to avoid:**
Every Server Action must independently verify: (1) the user is authenticated via `auth()`, (2) the user has the correct org membership and role, (3) the requested resource actually belongs to the user's organization. Use a centralized `createAction()` wrapper or middleware pattern that enforces auth and org-scoping by default, so security is structural rather than opt-in per function. Never rely on TypeScript types for runtime safety — Zod validation on all inputs is mandatory.

**Warning signs:**
- Server Actions that call `auth()` only at the top of a page, not inside the action file
- Actions that accept a bare `id` parameter without also querying `organizationId`
- No ownership check before destructive operations (delete, update)

**Phase to address:**
Foundation / Auth phase — establish the action wrapper pattern before writing any features, so it cannot be skipped.

---

### Pitfall 2: Cross-Tenant Data Leak via Missing organizationId Filter

**What goes wrong:**
A repository query fetches a page, comment, or user by its primary key alone — `findUnique({ where: { id } })`. If the ID was supplied by the user, another tenant can enumerate and read (or mutate) records from a different organization simply by guessing or cycling IDs.

**Why it happens:**
Prisma's ergonomics make single-field lookups feel safe because they are type-safe. Developers add `organizationId` to the schema but forget it in every individual query. A single missed filter is a data leak. The mistake compounds in search and list endpoints where filtering is applied only after the initial fetch.

**How to avoid:**
All repository methods that accept a user-supplied ID must include `organizationId` as a compound filter — `findUnique({ where: { id, organizationId } })`. Enforce this at the repository interface level so any implementation that omits it fails type-checking or a code review checklist. Write integration tests with two tenant fixtures to verify cross-tenant isolation for every resource type.

**Warning signs:**
- Repository methods with signature `getById(id: string)` but no org parameter
- Search queries that filter by text but not by tenant
- E2E tests that use only one user/org fixture

**Phase to address:**
Foundation / Multi-tenancy phase — define the repository interface with `organizationId` as a required parameter from the start. Retroactively adding it causes missed queries and likely a data leak.

---

### Pitfall 3: TipTap Link Extension Allows `javascript:` Protocol XSS

**What goes wrong:**
TipTap's link extension does not block `javascript:` href values in JSON content by default. Storing and rendering `{"type": "link", "attrs": {"href": "javascript:alert(1)"}}` results in a stored XSS — any user who clicks the link executes attacker-controlled JavaScript. HTML input sanitization was implemented but JSON input was not, creating an inconsistent security posture.

**Why it happens:**
TipTap documentation initially stated JSON and HTML were equally safe, which led developers to skip additional sanitization. The JSON representation looks like structured data rather than raw HTML, so the XSS vector is non-obvious.

**How to avoid:**
Configure the link extension with `protocols: ['http', 'https', 'mailto']` and `autolink: true` alongside an explicit `validate: href => /^https?:\/\//.test(href)` check. Additionally, run stored JSON through DOMPurify when rendering as HTML in any context outside the editor (e.g., search result previews, email digests). Do not assume the editor's output is safe just because it was created by TipTap.

**Warning signs:**
- Link extension installed without a `protocols` allowlist
- Content rendered directly from stored JSON without a sanitization step
- No test asserting that `javascript:` links are stripped before storage

**Phase to address:**
Editor phase — configure link security before accepting any user content.

---

### Pitfall 4: TipTap Schema Evolution Silently Drops Content

**What goes wrong:**
ProseMirror (the engine under TipTap) is strict about schema conformance — any JSON node type not recognized by the current schema is silently discarded when the editor loads the document. Adding or removing extensions between versions without migrating stored content means existing pages render with missing blocks, with no error shown to the user.

**Why it happens:**
Developers install a new extension, change an extension's node name, or remove an extension — and the stored JSON for all existing pages still references the old node type. ProseMirror drops unrecognized nodes without throwing.

**How to avoid:**
Treat TipTap's extension set as a versioned schema. Before changing the extension set in production: (1) write a content migration script that transforms old JSON to the new shape, (2) run it against all stored pages in a transaction, (3) test with real historical content. For simple renames, use `generateJSON()` to inspect stored content and run a recursive node-renaming transform. Store the schema version alongside the content in the database to enable future migrations.

**Warning signs:**
- Extension added or removed without a migration script
- Stored pages in the database that use node types no longer in the schema
- No test that loads historical content fixtures through the current editor

**Phase to address:**
Editor phase and any phase that modifies the extension set.

---

### Pitfall 5: Debounce-Save Loses Content on Tab Close / Navigation

**What goes wrong:**
TipTap content is saved via a debounced function (e.g., 2 seconds after the last keystroke). If the user closes the tab, navigates away, or the browser is killed before the debounce timer fires, the last edit is permanently lost. There is no indication to the user that unsaved changes exist.

**Why it happens:**
Debounce is simple to implement and feels correct — it reduces write frequency. The problem is that debounce only executes the save if the user pauses; an abrupt exit skips the final save entirely.

**How to avoid:**
(1) Flush the debounce immediately on `beforeunload` event (add a `window.addEventListener('beforeunload', flush)` and clean it up on component unmount). (2) Use `navigator.sendBeacon()` or `fetch` with `keepalive: true` for the final save so the request survives page close. (3) Display a "Saving..." / "Saved" indicator to set user expectations. (4) Consider a throttle+debounce hybrid: throttle at 30 seconds for intermediate saves, debounce at 2 seconds for quiet saves.

**Warning signs:**
- No `beforeunload` handler in the editor component
- No visible save-state indicator (saving / saved / error)
- Content loss reproducible by typing and immediately closing the tab

**Phase to address:**
Editor phase — implement before shipping the editor to any real user.

---

### Pitfall 6: Prisma Full-Text Search GIN Index Dropped on Every Migration

**What goes wrong:**
Implementing PostgreSQL full-text search with `tsvector` and a GIN index inside Prisma's managed schema causes Prisma Migrate to drop and recreate the GIN index on every `migrate dev` run — or worse, fail on generated columns entirely. The `GENERATED ALWAYS AS` syntax is not supported by Prisma's schema introspection, causing migration drift.

**Why it happens:**
Prisma does not natively support the `tsvector` data type or `GENERATED ALWAYS AS` expressions. When it detects schema drift, it attempts to "fix" it by dropping custom SQL it did not generate. This is a well-documented Prisma limitation with no first-party fix as of 2026.

**How to avoid:**
Use a hybrid approach: (1) Mark the `tsvector` column as `Unsupported("tsvector")` in the Prisma schema for type awareness. (2) Allow Prisma to generate the initial migration file. (3) Manually edit the migration SQL to add the `GENERATED ALWAYS AS` expression and GIN index. (4) Use a PostgreSQL trigger to keep the `tsvector` column updated on inserts/updates instead of relying on generated columns — triggers survive Prisma migrations. (5) Query using `prisma.$queryRaw` with explicit GIN index hints for search queries.

**Warning signs:**
- `prisma migrate dev` produces a migration that drops a GIN index you just created
- Search queries are scanning full tables (check `EXPLAIN ANALYZE`)
- Prisma schema has a raw `tsvector` column type without `Unsupported()`

**Phase to address:**
Search phase — plan the hybrid migration approach before implementing the feature.

---

### Pitfall 7: Neon Cold Starts Causing Connection Timeouts on Vercel

**What goes wrong:**
Neon's free tier computes scale to zero after inactivity (approximately 5 minutes). When a serverless Vercel function invocation triggers a Neon compute wake-up at the same time Prisma's query engine has a short default timeout, the first request after inactivity returns a connection error or P1001 instead of a slow-but-successful response.

**Why it happens:**
Prisma's default connection timeout may be shorter than Neon's cold start duration. Additionally, each Vercel function invocation may attempt a new database connection — without connection pooling this exhausts Neon's free-tier connection limit rapidly.

**How to avoid:**
(1) Use two connection strings: `DATABASE_URL` with `-pooler` in the hostname for all application queries, and `DIRECT_URL` for Prisma CLI migrations only. (2) Add `connect_timeout=15` to the connection string query parameters. (3) Configure Prisma with `connection_limit=1` in serverless mode to prevent connection exhaustion. (4) Use `@prisma/adapter-neon` with the Neon serverless driver for HTTP-based connections instead of TCP, which avoids cold start timeout issues entirely.

**Warning signs:**
- P1001 errors appearing in production logs intermittently
- Errors only appear for the first request after a period of inactivity
- `DATABASE_URL` and `DIRECT_URL` both point to the non-pooled connection string

**Phase to address:**
Foundation / Infrastructure phase — configure before any features are built.

---

### Pitfall 8: Next.js Router Cache Showing Stale Data After Mutations

**What goes wrong:**
A user creates a new page, deletes a record, or renames something. The mutation completes successfully. The user navigates to another route and back — the old data appears because the Next.js client-side Router Cache (30-second default TTL) has not been invalidated. `revalidatePath()` called inside a Server Action only clears the server Data Cache, not the client Router Cache in all scenarios.

**Why it happens:**
Next.js App Router has four distinct caches (Request Memoization, Data Cache, Full Route Cache, Router Cache) that operate independently. Developers expect that calling `revalidatePath()` after a Server Action refreshes everything visible to the user, but the client Router Cache has its own lifecycle.

**How to avoid:**
After mutations in Server Actions, call both `revalidatePath()` for server cache and `router.refresh()` on the client — or rely on TanStack Query to maintain client-side truth and use `invalidateQueries` to force a refetch. For the page-tree sidebar (optimistic updates), always call `invalidateQueries(['pages', orgId])` in `onSettled` of every mutation so the server state is eventually synchronized regardless of optimistic update success or failure.

**Warning signs:**
- User creates/deletes a page and the sidebar doesn't update without a full browser refresh
- Stale counts or names visible after renaming
- No `onSettled` callback on TanStack Query mutations that calls `invalidateQueries`

**Phase to address:**
Page tree / Navigation phase — verify cache invalidation behavior for every mutation before considering a feature done.

---

### Pitfall 9: Hierarchical Page Tree With Integer `order` Field Requiring Mass Rewrite on Reorder

**What goes wrong:**
Storing page position as a sequential integer (1, 2, 3...) means that inserting a page between positions 2 and 3 requires updating every page with `order >= 3` in a transaction. For a user with hundreds of pages this creates performance problems and write amplification. Drag-and-drop reorders become expensive bulk updates.

**Why it happens:**
Integer ordering is the first approach that comes to mind and is straightforward to implement. The O(n) write cost is invisible at small scale and only becomes a problem when page counts grow or operations are frequent.

**How to avoid:**
Use fractional indexing from the start: store `order` as a `FLOAT` or a `TEXT` string (lexicographic sort). Each reorder operation updates only the moved item — the new position is calculated as the average of its neighbors' positions (or an encoded string midpoint). Libraries like `fractional-indexing` provide this calculation. Reserve rebalancing (bulk rewrite) as a background operation triggered only when positions become too close to represent distinctly.

**Warning signs:**
- `order` field typed as `Int` in the Prisma schema
- Reorder operation uses a SQL transaction that updates multiple rows
- Page list queries use `ORDER BY order ASC` on an integer column

**Phase to address:**
Page tree / Navigation phase — choose fractional indexing before writing the first page-tree mutation.

---

### Pitfall 10: Recursive CTE for Deep Page Trees Without a Depth Limit

**What goes wrong:**
Fetching an entire subtree with `WITH RECURSIVE` and no termination condition or depth cap will follow cycles or deeply nested paths until the database engine runs out of memory or the query times out. Notion-like apps where users can nest pages arbitrarily are particularly vulnerable.

**Why it happens:**
Recursive CTEs are the natural PostgreSQL tool for hierarchical data and work correctly in development with shallow trees. Missing a `WHERE depth < N` guard is easy to overlook.

**How to avoid:**
Always include a depth-limit clause in recursive queries: `WHERE depth < 20` (or whatever the maximum nesting the UI supports). Add a database-level check constraint on the parent-child relationship to prevent cycles: `CHECK (id <> parentId)`. Index `parentId` on the pages table — recursive CTE traversal without an index on the join column is a full-table scan at each recursion level.

**Warning signs:**
- Recursive CTE query missing a `WHERE depth < N` clause
- No index on `parentId` column
- No check constraint preventing a page from being its own parent

**Phase to address:**
Page tree / Navigation phase — add depth limit and indexes from the first migration.

---

### Pitfall 11: Auth.js Database Sessions Break Edge Middleware

**What goes wrong:**
Configuring Auth.js with a Prisma database adapter and `strategy: "database"` sessions, then attempting to protect routes with Next.js middleware running on the Edge runtime, causes a runtime error — Prisma's query engine cannot run on the Edge. All route protection in middleware silently breaks or throws.

**Why it happens:**
Auth.js v5's documentation recommends JWT sessions for middleware-based protection, but developers familiar with Auth.js v4 default to database sessions. The mismatch between the Edge-compatible JWT session strategy and the Node.js-only Prisma adapter is not always obvious in setup guides.

**How to avoid:**
Use `strategy: "jwt"` for Auth.js sessions. Store minimal identity claims in the JWT (userId, orgId, role). Fetch extended user/org data from the database only in Server Components or Server Actions — never in middleware. Middleware should only decode the JWT and check authentication status, not query the database.

**Warning signs:**
- Auth.js configured with a Prisma adapter and no explicit `strategy: "jwt"` override
- Middleware attempting to call `auth()` with a database-backed session
- Edge runtime errors appearing in Vercel logs referencing Prisma binary engine

**Phase to address:**
Foundation / Auth phase — establish session strategy before any middleware is written.

---

### Pitfall 12: TanStack Query Optimistic Updates on Page Tree Out of Sync With Multiple Query Keys

**What goes wrong:**
The page tree sidebar is managed by a `['pages', orgId]` query key. Individual page metadata may also be cached under `['page', pageId]`. When a rename or move operation updates the item in the list cache via `setQueryData`, the individual page cache retains stale data. The user sees different names or positions depending on which component reads from which cache key.

**Why it happens:**
Optimistic updates with `setQueryData` are scoped to a single query key. Developers update the list correctly but forget that the same entity is cached under a different key elsewhere in the component tree.

**How to avoid:**
On `onSettled` of every page mutation (rename, move, delete), call `invalidateQueries` on all related keys — both `['pages', orgId]` and `['page', pageId]`. Accept the refetch cost in `onSettled`; the optimistic update still provides instant UI feedback, and the eventual refetch ensures consistency. Prefer broad key invalidation over surgical `setQueryData` updates across multiple keys.

**Warning signs:**
- Page title in the sidebar differs from the title in the editor header after a rename
- `onSettled` callback is missing from mutations that modify page metadata
- Multiple `useQuery` hooks that can return the same entity under different keys

**Phase to address:**
Page tree / Editor phases — define query key structure and invalidation strategy before writing mutations.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Integer ordering for page tree | Simple to implement | Mass rewrite on every reorder, O(n) updates | Never — fractional indexing adds minimal complexity upfront |
| Skip `organizationId` in one repository method | Faster to write | Cross-tenant data leak, security incident | Never |
| Omit `beforeunload` flush in editor | Simpler component | Periodic user data loss | Never — a 5-line fix prevents complete trust erosion |
| `strategy: "database"` with Prisma adapter | Familiar pattern | Edge middleware broken, route protection fails silently | Never in this stack |
| Store TipTap JSON without link protocol validation | Simpler storage | Stored XSS, user data exfiltrated via clicked links | Never |
| Full-text search via `ILIKE` instead of `tsvector` | Zero setup | Poor performance, no relevance ranking, full table scans | Only for MVP search with < 1,000 pages; must be replaced before launch |
| Hardcode `revalidatePath('/')` after mutations | Simple cache clear | Expensive — invalidates all cached routes on every save | Only during early prototyping |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Neon + Prisma | Single connection string used for both app and migrations | `DATABASE_URL` = pooled (-pooler) for app; `DIRECT_URL` = direct for Prisma CLI |
| Neon + Vercel | No `connect_timeout` on connection string | Add `?connect_timeout=15` to `DATABASE_URL` |
| Auth.js v5 + Prisma | Using `strategy: "database"` with Edge middleware | Use `strategy: "jwt"`; query DB only in Server Components/Actions |
| Auth.js v5 | Using `NEXTAUTH_SECRET` env var (v4 name) | Use `AUTH_SECRET` — v5 renamed all env vars to `AUTH_` prefix |
| TipTap + Next.js | Importing TipTap in a Server Component | TipTap requires `"use client"` — all editor components must be client-side |
| TanStack Query + Server Actions | Not calling `invalidateQueries` in `onSettled` | Always invalidate affected keys in `onSettled`, never only in `onSuccess` |
| Prisma + GIN index | Allowing `migrate dev` to manage `tsvector` columns | Use `Unsupported("tsvector")` + manual migration SQL + trigger for sync |
| Resend + multi-tenant | Sending invitation emails without rate-limit guard | 100 emails/day on free tier; an org with 100 members will exhaust the daily quota in one invitation burst |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No GIN index on `tsvector` search column | Search queries take >500ms, EXPLAIN shows Seq Scan | Create GIN index at migration time; use the trigger-based approach | ~500 pages per tenant |
| Recursive CTE with no depth limit | Occasional query timeouts, DB memory spikes | Add `WHERE depth < 20` to all recursive queries | Trees with > 20 levels or cycles |
| No index on `pages.parentId` | Sidebar tree load slow for large page sets | Add `@@index([parentId])` in Prisma schema from the start | > 200 pages per user |
| No index on `pages.organizationId` | All page list queries slow as tenants grow | Add `@@index([organizationId])` in initial schema | > 10 tenants with > 50 pages each |
| Fetching entire page tree on every keystroke in editor | Excessive API calls, sidebar flickering | Cache page tree in TanStack Query with `staleTime: 30000`; only refetch on explicit mutations | Any typing-speed interactions |
| TipTap serializing JSON on every `update` event | CPU spike during typing, especially on large documents | Debounce the `editor.getJSON()` call, not just the save request | Documents > 50KB |
| N+1 in page list with member avatars | Slow org page, many DB round trips | Use Prisma `include` to eager-load relations in a single query | > 10 pages per request |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| No `organizationId` filter in resource queries | Cross-tenant data read/write (critical) | Require `organizationId` in all repository method signatures; integration test with two-tenant fixture |
| Missing auth check in Server Action | Unauthenticated user modifies data | Centralized action wrapper that calls `auth()` and throws if no session |
| Missing ownership check in Server Action | Authenticated user modifies another user's data | Always include both `userId`/`organizationId` AND the resource `id` in WHERE clause |
| TipTap link href not validated | Stored XSS via `javascript:` protocol | Configure link extension with explicit `protocols` allowlist; server-side strip on save |
| JWT with role/org stored client-side in localStorage | Token theft, impersonation | Use Auth.js session cookies (HttpOnly, Secure, SameSite=Lax); never localStorage |
| Server Action accepts raw `organizationId` from client | Tenant escalation — user claims membership in a different org | Derive `organizationId` from the server-side session, never from client input |
| Rate limiting only on login endpoint | Invitation spam, enumeration via password reset | Rate limit all auth endpoints (login, register, reset, invite) and all write Server Actions |
| Content rendered from stored JSON without sanitization | XSS via crafted content in non-editor contexts (search previews) | Run DOMPurify on any HTML derived from stored TipTap JSON before rendering outside the editor |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No save-state indicator in editor | Users lose work because they don't know content isn't saved | Show "Saving..." spinner and "Saved" confirmation in editor header; show error if save fails |
| Silent page delete (no undo) | Accidental deletions are permanent — users abandon the product | Implement soft delete with Trash and 30-day recovery before exposing delete action in the UI |
| Empty state on first login before personal org is created | User sees a blank screen with no guidance | Auto-create personal org and a "Getting Started" page on signup via a post-registration Server Action |
| Page tree re-fetches and re-renders during drag | Janky drag experience, items jump | Keep drag state fully local during the drag operation; only commit to server on drop |
| Full-page navigation when clicking sidebar items | 300-500ms white flash between pages | Use Next.js Link with App Router to enable client-side navigation; prefetch visible tree items |
| Invitation email sent but no pending state shown | Invited member doesn't know to check email; re-invites send duplicate emails | Show "Invitation pending" badge next to invited member in org settings |

---

## "Looks Done But Isn't" Checklist

- [ ] **Editor save:** Verify content is flushed to the server on tab close — test by typing, immediately closing the tab, reopening, and confirming content is present.
- [ ] **Org isolation:** Confirm that fetching a page ID belonging to Org A while authenticated as Org B returns 404 — not the page contents.
- [ ] **Server Actions:** Confirm each action throws (not silently returns) when called without a valid session by hitting the endpoint directly with `curl` and no cookie.
- [ ] **TipTap links:** Confirm that saving a page with `href="javascript:alert(1)"` and reloading does not execute JavaScript when clicking the link.
- [ ] **Search scope:** Confirm search results include only pages from the current org — not pages from other orgs with matching text.
- [ ] **Trash recovery:** Confirm soft-deleted pages are not visible in the sidebar or search, but are visible in Trash and can be restored.
- [ ] **Role enforcement:** Confirm a Member-role user cannot access Admin-only endpoints (org settings mutations, member removal) even by calling the Server Action directly.
- [ ] **Neon cold start:** Confirm the first request after 10 minutes of inactivity succeeds (may be slow but must not error).
- [ ] **Migration safety:** Confirm `prisma migrate dev` does not drop the GIN index on the `tsvector` column after running.
- [ ] **Page tree depth:** Confirm nesting a page 20+ levels deep does not cause a query timeout or infinite loop.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Cross-tenant data leak discovered post-launch | HIGH | Audit all query logs, identify affected tenants, notify users, add `organizationId` filter to all missing queries, rotate tokens |
| TipTap schema change drops content | HIGH | Restore from database backup, write migration script to transform stored JSON, re-apply migration |
| Integer ordering rewrite needed | MEDIUM | Write a one-time migration that converts integer `order` to fractional `FLOAT` positions; run in a transaction |
| GIN index dropped by Prisma migration | LOW | Re-create GIN index manually via `prisma migrate resolve` + custom SQL; no data loss |
| Stored XSS in link hrefs discovered | MEDIUM | One-time script to scan all stored TipTap JSON for `javascript:` hrefs and null them out; patch extension config |
| Neon connection exhaustion causing P1001 errors | LOW | Switch `DATABASE_URL` to pooled endpoint immediately; no data loss |
| Content lost due to missing `beforeunload` flush | MEDIUM | No recovery for lost content; fix the bug, communicate to affected users, add server-side draft snapshots going forward |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Server Actions lack auth/ownership checks | Phase 1: Foundation & Auth | Integration test: unauthenticated curl to each action returns 401 |
| Cross-tenant data leak via missing org filter | Phase 1: Foundation & Multi-tenancy | Integration test: two-tenant fixture, cross-tenant read returns 404 |
| Neon cold start + connection exhaustion | Phase 1: Infrastructure setup | Test: 10-minute idle then first request succeeds |
| Auth.js database sessions break Edge middleware | Phase 1: Auth configuration | Middleware test: protected route blocks unauthenticated request |
| Auth.js env var naming (v5 `AUTH_` prefix) | Phase 1: Auth configuration | CI check: `AUTH_SECRET` present in environment |
| TipTap link XSS via `javascript:` protocol | Phase 2: Editor | Security test: link with `javascript:` href saved and re-rendered does not execute |
| TipTap schema migration drops content | Phase 2: Editor (and any extension change) | Test: load historical content fixture through current editor schema |
| Debounce-save loses content on tab close | Phase 2: Editor | Manual test: type, close tab immediately, reopen — content present |
| TanStack Query stale data after mutations | Phase 3: Page tree / Navigation | E2E test: create page, navigate away, navigate back — new page visible |
| Integer `order` field requiring mass rewrite | Phase 3: Page tree / Navigation | Schema review: `order` field is `Float`, not `Int` |
| Recursive CTE without depth limit | Phase 3: Page tree / Navigation | Unit test: query with 25-level deep tree does not timeout |
| Prisma GIN index dropped on migration | Phase 4: Search | Run `migrate dev` then `EXPLAIN ANALYZE` — GIN index present in query plan |
| Full-text search missing org scope | Phase 4: Search | Integration test: search returns only current org's pages |
| Optimistic update cache key mismatch | Phase 3 & 2: Page tree + Editor | Test: rename page, check both sidebar and editor header reflect new name |

---

## Sources

- [Next.js Server Actions Security: 5 Vulnerabilities — MakerKit](https://makerkit.dev/blog/tutorials/secure-nextjs-server-actions)
- [Common mistakes with the Next.js App Router — Vercel Blog](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them)
- [CVE-2025-29927: Next.js Middleware Authorization Bypass — ProjectDiscovery](https://projectdiscovery.io/blog/nextjs-middleware-authorization-bypass)
- [Potential XSS vulnerability in TipTap link extension — GitHub Issue #3673](https://github.com/ueberdosis/tiptap/issues/3673)
- [TipTap Schema documentation — tiptap.dev](https://tiptap.dev/docs/editor/core-concepts/schema)
- [Bulletproof FTS in Prisma with PostgreSQL tsvector — Medium](https://medium.com/@chauhananubhav16/bulletproof-full-text-search-fts-in-prisma-with-postgresql-tsvector-without-migration-drift-c421f63aaab3)
- [Prisma full-text search index not used — GitHub Issue #8950](https://github.com/prisma/prisma/issues/8950)
- [Connect from Prisma to Neon — Neon Official Docs](https://neon.com/docs/guides/prisma)
- [Concurrent Optimistic Updates in React Query — tkdodo.eu](https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query)
- [Optimistic Updates across multiple query keys — TanStack Discussion #1780](https://github.com/TanStack/query/discussions/1780)
- [Fractional Indexing for Reordering — hollos.dev](https://hollos.dev/blog/fractional-indexing-a-solution-to-sorting/)
- [PostgreSQL: Speeding up recursive queries — cybertec-postgresql.com](https://www.cybertec-postgresql.com/en/postgresql-speeding-up-recursive-queries-and-hierarchic-data/)
- [Auth.js Role Based Access Control — authjs.dev](https://authjs.dev/guides/role-based-access-control)
- [Auth.js Migrating to v5 — authjs.dev](https://authjs.dev/getting-started/migrating-to-v5)
- [Preventing Cross-Tenant Data Leakage — agnitestudio.com](https://agnitestudio.com/blog/preventing-cross-tenant-leakage/)
- [Postgres RLS Implementation Guide — permit.io](https://www.permit.io/blog/postgres-rls-implementation-guide)
- [Debounce vs Throttle for autosave — tomekdev.com](https://tomekdev.com/posts/throttle-vs-debounce-on-real-examples)
- [Next.js App Router Caching Deep Dive — GitHub Discussion #54075](https://github.com/vercel/next.js/discussions/54075)

---
*Pitfalls research for: Notion-like block-based productivity app (Notely)*
*Researched: 2026-03-24*
