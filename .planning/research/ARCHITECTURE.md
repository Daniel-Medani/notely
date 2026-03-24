# Architecture Research

**Domain:** Notion-like block-based productivity app (multi-tenant SaaS)
**Researched:** 2026-03-24
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser (Client Layer)                       │
│                                                                       │
│  ┌──────────────┐  ┌────────────────────┐  ┌─────────────────────┐  │
│  │  Sidebar /   │  │   Editor ("use      │  │   Auth / Org UI     │  │
│  │  Page Tree   │  │   client" TipTap)   │  │   (Server + Client) │  │
│  │  TanStack Q  │  │   + debounce save   │  │                     │  │
│  └──────┬───────┘  └────────┬───────────┘  └────────┬────────────┘  │
│         │                  │                        │               │
├─────────┴──────────────────┴────────────────────────┴───────────────┤
│                     Next.js App Router (Server Layer)                │
│                                                                       │
│  ┌──────────────────────────┐  ┌──────────────────────────────────┐  │
│  │   proxy.ts               │  │   Route Handlers                 │  │
│  │   Auth.js session check  │  │   (webhooks only — Resend,       │  │
│  │   + org path guard       │  │    Auth.js callbacks)            │  │
│  └──────────────────────────┘  └──────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │              Server Actions (all mutations)                   │    │
│  │   auth/  │  pages/  │  orgs/  │  search/  │  editor/         │    │
│  └──────────────────────────────┬───────────────────────────────┘    │
│                                 │                                     │
├─────────────────────────────────┴───────────────────────────────────┤
│                         Service Layer                                 │
│                                                                       │
│  ┌──────────┐  ┌────────────┐  ┌─────────┐  ┌────────────────────┐  │
│  │ AuthSvc  │  │  PageSvc   │  │  OrgSvc │  │   SearchSvc        │  │
│  └────┬─────┘  └─────┬──────┘  └────┬────┘  └────────┬───────────┘  │
│       │              │              │                 │              │
├───────┴──────────────┴──────────────┴─────────────────┴─────────────┤
│                      Repository Layer (IRepository interfaces)        │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ PrismaUserR. │  │ PrismaPageR. │  │ PrismaOrgRepository      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘   │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                    Data Layer (PostgreSQL via Neon)                   │
│                                                                       │
│  users  │  organizations  │  memberships  │  pages  │  invitations   │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| proxy.ts | Intercepts every request; validates session, guards `/[org]/` routes, redirects unauthenticated users | Auth.js session store |
| Server Components (RSC) | Initial data fetch via service layer; render HTML shell; pass serialized data to client components | Service layer, TanStack Query hydration |
| Server Actions | Validate input (Zod), call service, return typed result to client | Service layer |
| Route Handlers | Webhook ingestion only (Resend email events, Auth.js OAuth callbacks) | External services |
| TanStack Query (client) | Cache page tree, org state; optimistic mutations on create/rename/delete/move | Server Actions (as mutation functions) |
| TipTap Editor | Client-only rich-text editing; fires `onUpdate` → debounced Server Action | Server Actions (save) |
| Service layer | Business logic, authorization checks, transaction coordination | Repository interfaces |
| Repository layer (Prisma) | DB queries scoped by `organizationId` on every call | Neon PostgreSQL |
| Auth.js | Session management, JWT tokens, OAuth provider bridge, CSRF | Route Handlers (`/api/auth/[...nextauth]`) |

## Recommended Project Structure

```
src/
├── app/                            # Next.js App Router
│   ├── (auth)/                     # Route group — unauthenticated pages
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (onboarding)/               # Post-signup org creation flow
│   │   └── new-org/page.tsx
│   ├── [org]/                      # Dynamic tenant segment
│   │   ├── layout.tsx              # Fetches org + membership, passes to providers
│   │   ├── page.tsx                # Redirect to first page or empty state
│   │   └── [pageId]/
│   │       └── page.tsx            # Page view (Server Component shell)
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/route.ts
│   └── layout.tsx                  # Root layout: TanStack Query Provider, Themes
│
├── features/
│   ├── auth/
│   │   ├── actions/                # Server Actions: signIn, signOut, register
│   │   ├── components/             # LoginForm, RegisterForm
│   │   ├── services/               # AuthService (IAuthRepository)
│   │   └── repositories/           # PrismaUserRepository
│   │
│   ├── orgs/
│   │   ├── actions/                # Server Actions: createOrg, inviteMember, removeMember
│   │   ├── components/             # OrgSwitcher, MemberList, InviteModal
│   │   ├── services/               # OrgService, InvitationService
│   │   └── repositories/           # PrismaOrgRepository, PrismaInvitationRepository
│   │
│   ├── pages/
│   │   ├── actions/                # Server Actions: createPage, renamePage, deletePage, movePage
│   │   ├── components/             # PageTree, PageTreeItem, TrashDrawer
│   │   ├── hooks/                  # usePageTree (TanStack Query + optimistic updates)
│   │   ├── services/               # PageService
│   │   └── repositories/           # PrismaPageRepository
│   │
│   ├── editor/
│   │   ├── actions/                # Server Actions: savePage (debounced target)
│   │   ├── components/             # Editor.tsx ("use client"), EditorToolbar
│   │   ├── extensions/             # TipTap extension configs (CodeBlockLowlight, etc.)
│   │   └── hooks/                  # useDebouncesSave
│   │
│   └── search/
│       ├── actions/                # Server Actions: searchPages
│       ├── components/             # SearchModal, SearchResult
│       └── services/               # SearchService (PostgreSQL full-text)
│
├── lib/
│   ├── db.ts                       # Prisma client singleton
│   ├── auth.ts                     # Auth.js configuration
│   ├── auth.config.ts              # Auth config without adapter (for proxy.ts)
│   └── errors.ts                   # Typed error classes
│
├── shared/
│   ├── components/                 # Button, Modal, ThemeToggle (shadcn wrappers)
│   └── hooks/                      # useCurrentOrg, useCurrentUser
│
└── proxy.ts                        # Auth + org session guard (replaces middleware.ts)
```

### Structure Rationale

- **features/:** Each feature is a vertical slice: actions + components + services + repositories together. A developer working on "pages" never needs to leave `src/features/pages/`. Cross-feature imports are explicit, not accidental.
- **app/[org]/:** The `[org]` dynamic segment is the tenancy boundary. The layout.tsx at this level resolves the org and rejects unauthorized access before any child route renders.
- **lib/:** Singletons and cross-cutting concerns only. The Prisma client must be a singleton to avoid exhausting connection pools on hot reload.
- **proxy.ts:** Auth.js v5 + Next.js 16 uses `proxy.ts` with `export function proxy()`, not `middleware.ts`. The proxy handles session checks at the edge before any Server Component runs.

## Architectural Patterns

### Pattern 1: Tenant-Scoped Repository

Every repository method receives `organizationId` as a required parameter and appends it to every query clause. No query ever touches data without a tenant scope.

**When to use:** Every data access call in the system — no exceptions.
**Trade-offs:** Slightly verbose call sites; prevents cross-tenant data leaks without needing RLS.

**Example:**
```typescript
// features/pages/repositories/PrismaPageRepository.ts
class PrismaPageRepository implements IPageRepository {
  async findById(id: string, organizationId: string): Promise<Page | null> {
    return this.db.page.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
  }

  async findChildren(parentId: string | null, organizationId: string): Promise<Page[]> {
    return this.db.page.findMany({
      where: { parentId, organizationId, deletedAt: null },
      orderBy: { order: 'asc' },
    });
  }
}
```

### Pattern 2: Optimistic Page Tree with TanStack Query

The sidebar page tree mutates locally (via `setQueryData`) before the Server Action resolves. On error, the previous snapshot is restored. Keeps sidebar feel instant without real-time infrastructure.

**When to use:** Create, rename, delete, move operations on the page tree.
**Trade-offs:** Requires careful key design and snapshot rollback logic; not needed for editor content (debounce handles that).

**Example:**
```typescript
// features/pages/hooks/usePageTree.ts
export function useRenamePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      renamePage(id, title), // Server Action
    onMutate: async ({ id, title }) => {
      await queryClient.cancelQueries({ queryKey: ['pageTree'] });
      const previous = queryClient.getQueryData(['pageTree']);
      queryClient.setQueryData(['pageTree'], (old: Page[]) =>
        old.map((p) => (p.id === id ? { ...p, title } : p))
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['pageTree'], ctx?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pageTree'] });
    },
  });
}
```

### Pattern 3: TipTap Debounce Save

TipTap is a client-only component (`'use client'`). It fires `onUpdate` on every keystroke. A `useRef`-based debounce batches these into a Server Action call every ~1000ms of inactivity. No optimistic layer needed — the editor is the source of truth locally until saved.

**When to use:** All editor content persistence.
**Trade-offs:** Content can be lost on hard crash within debounce window; acceptable for v1 (no offline/real-time requirement).

**Example:**
```typescript
// features/editor/hooks/useDebouncesSave.ts
export function useDebouncedSave(pageId: string) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  return useCallback((content: JSONContent) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      savePageContent(pageId, content); // Server Action — fire and forget
    }, 1000);
  }, [pageId]);
}
```

### Pattern 4: Self-Referential Page Tree (Adjacency List)

Pages reference their own table via `parentId`. Root pages have `parentId: null`. The sidebar loads all pages for an org in one query and builds the tree client-side — avoids N+1 and recursive DB queries.

**When to use:** Hierarchical page structure.
**Trade-offs:** Full tree loaded at once; acceptable for v1 at Neon free-tier scale (< 10k pages per org is realistic). Recursive DB queries are not needed because Prisma does not support PostgreSQL CTEs natively.

**Example (Prisma schema):**
```prisma
model Page {
  id             String   @id @default(cuid())
  title          String   @default("Untitled")
  content        Json?
  organizationId String
  parentId       String?
  parent         Page?    @relation("PageToPage", fields: [parentId], references: [id])
  children       Page[]   @relation("PageToPage")
  order          Int      @default(0)
  deletedAt      DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization   Organization @relation(fields: [organizationId], references: [id])

  @@index([organizationId, parentId])
  @@index([organizationId, deletedAt])
}
```

## Data Flow

### Read Flow — Page View

```
User navigates to /[org]/[pageId]
    ↓
proxy.ts: validates session + org membership → 401/403 or continue
    ↓
[org]/[pageId]/page.tsx (Server Component)
    ↓ calls
PageService.getPage(pageId, organizationId)
    ↓ calls
PrismaPageRepository.findById(pageId, organizationId)
    ↓ returns
Page record (null → 404)
    ↓
Server Component renders HTML shell with hydrated content
    ↓
Editor.tsx ("use client") mounts with initialContent, TanStack Query hydrates pageTree
```

### Write Flow — Page Tree Mutation

```
User clicks "New Page" in sidebar
    ↓
useCreatePage.mutate({ parentId, organizationId })
    ↓ (immediately)
TanStack Query: optimistic setQueryData → sidebar re-renders with temp page
    ↓ (async)
Server Action: createPage(input)
    ↓
Zod validation → PageService.createPage() → PrismaPageRepository.create()
    ↓
Returns { success: true, page } or typed error
    ↓ onSettled
queryClient.invalidateQueries(['pageTree']) → reconcile with server state
```

### Write Flow — Editor Content Save

```
User types in TipTap editor
    ↓ onUpdate fires
useDebouncedSave: clears/sets 1000ms timer
    ↓ (after 1000ms inactivity)
Server Action: savePageContent(pageId, jsonContent)
    ↓
Zod validation → PageService.updateContent() → PrismaPageRepository.updateContent()
    ↓
No client state update needed — TipTap is local source of truth
```

### Auth Flow — Session + Org Resolution

```
Any request to /[org]/...
    ↓
proxy.ts: Auth.js getSession()
    ├─ No session → redirect /login
    └─ Session exists → extract org slug from path
         ↓
         OrgService.getOrgBySlug(slug) → verify user is member
         ├─ Not member → redirect /403
         └─ Member → inject org context into request headers → continue
```

## Component Boundaries (What Talks to What)

| From | To | Channel | Notes |
|------|----|---------|-------|
| proxy.ts | Auth.js session | Edge runtime | Must use `auth.config.ts` (no Prisma adapter at edge) |
| Server Component | Service layer | Direct import | Server-only; never imported in client components |
| Client Component | Server Actions | `import` + call | Type-safe; no HTTP boilerplate |
| Server Action | Service | Direct import | Service validates authorization, not the action |
| Service | IRepository interface | Constructor injection | Enables mock repositories in tests |
| PrismaRepository | Prisma client | `lib/db.ts` singleton | Shared across request lifecycle |
| TanStack Query | Server Actions | `mutationFn` | Actions act as the "API" for the client |
| TipTap Editor | useDebouncedSave hook | `onUpdate` callback | Decoupled from save logic |
| Auth.js | Neon (users table) | Prisma adapter | Persists sessions and OAuth accounts |

**Critical boundary:** Server Actions and Service layer are never imported in `"use client"` components directly — only via TanStack Query's `mutationFn` or `queryFn`. This prevents accidental server-side code leaking to the bundle.

## Suggested Build Order

Dependencies between components determine safe build order:

1. **Foundation: DB schema + Prisma setup + Auth.js**
   - Everything else depends on the schema being stable and auth working.
   - Deliver: `users`, `organizations`, `memberships`, `pages` tables; Auth.js email+Google; auto-create personal org on signup; proxy.ts tenant guard.

2. **Page tree CRUD + sidebar**
   - Depends on: pages schema, auth, org context.
   - Deliver: create/rename/delete/move with optimistic updates; hierarchical sidebar navigation.

3. **Block editor**
   - Depends on: pages exist and are accessible, save action available.
   - Deliver: TipTap with configured extensions, debounce save, code blocks with syntax highlighting.

4. **Search**
   - Depends on: pages have content stored as text/JSON in DB.
   - Deliver: PostgreSQL full-text search via `to_tsvector`; SearchModal with keyboard shortcut.

5. **Org management + invitations**
   - Depends on: auth, org model, Resend email.
   - Deliver: invite by email, accept invitation flow, role display, member removal.

6. **Trash + soft deletes**
   - Depends on: page CRUD working end-to-end.
   - Deliver: `deletedAt` filter on all queries; TrashDrawer; restore + permanent delete.

7. **Polish: dark mode, rate limiting, CI/CD hardening**
   - Depends on: all features functional.
   - Deliver: system-aware theme toggle, rate limits on auth + write endpoints, full E2E suite.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Current monolith is correct — no changes needed. Neon serverless scales to zero. |
| 1k-100k users | Add PostgreSQL full-text search indexes; consider connection pooling via PgBouncer (Neon handles this). Split read-heavy routes to use React Server Components without TanStack Query hydration overhead. |
| 100k+ users | Extract editor save to a dedicated write path with a queue; consider Neon branching for isolated tenant DBs; add Redis for search autocomplete cache. Out of scope for v1. |

### Scaling Priorities

1. **First bottleneck:** Neon free tier connection limits. PgBouncer pooling (built into Neon) and the Prisma singleton pattern prevent connection exhaustion on cold starts.
2. **Second bottleneck:** Full-text search at volume. PostgreSQL `GIN` indexes on `tsvector` columns handle this well into mid-scale without Elasticsearch.

## Anti-Patterns

### Anti-Pattern 1: Fetching Pages Recursively Per Level

**What people do:** Load root pages, then for each page that's expanded in the sidebar, fire another query to load its children.
**Why it's wrong:** N+1 queries; sidebar feels laggy on every expand; complex loading state management.
**Do this instead:** Load all non-deleted pages for the org in a single query on sidebar mount. Build the tree client-side in memory. Re-fetch on mutation settlement. At Neon free-tier scale this is always fast.

### Anti-Pattern 2: Saving Raw HTML from TipTap

**What people do:** Use `editor.getHTML()` and store the HTML string in the database.
**Why it's wrong:** HTML is an output format, not a data format. Makes search difficult (must strip tags), content migration hard, and creates XSS surface area.
**Do this instead:** Store `editor.getJSON()` (TipTap's ProseMirror JSON). Render to HTML only at display time via TipTap's `generateHTML()`. Index plain text for search separately.

### Anti-Pattern 3: Calling Service Layer from Client Components

**What people do:** Import a service function directly in a `"use client"` component to avoid writing a Server Action.
**Why it's wrong:** Next.js will either error (if the service imports Prisma, which is Node-only) or silently bundle server code into the client, exposing DB logic.
**Do this instead:** Always mediate through a Server Action. The Server Action is the only legal boundary between client and server code.

### Anti-Pattern 4: Skipping organizationId on Every Query

**What people do:** Trust that the page `id` is unguessable (UUID), so skip the `organizationId` filter to simplify query code.
**Why it's wrong:** UUID unguessability is security through obscurity. A user with a valid session from Org A can access Org B's pages by guessing or leaking IDs. The `organizationId` check is the actual authorization gate.
**Do this instead:** Every repository method takes `organizationId` as a required parameter. The service always passes it. Tests verify cross-tenant access is rejected.

### Anti-Pattern 5: Putting Business Logic in Server Actions

**What people do:** Write authorization checks, validation beyond Zod schema, and complex orchestration directly inside Server Action functions.
**Why it's wrong:** Server Actions become untestable (they require the Next.js runtime to execute). Business logic cannot be unit tested without spinning up the full framework.
**Do this instead:** Server Actions are thin: parse Zod, get session, call service, return result. All logic lives in the service layer, which is testable with mock repositories in plain Vitest.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Neon PostgreSQL | Prisma client via `DATABASE_URL` | Use `?pgbouncer=true&connection_limit=1` in the URL for serverless; prevents connection pool exhaustion |
| Auth.js (NextAuth v5) | Route Handler at `/api/auth/[...nextauth]` + `proxy.ts` session check | `auth.config.ts` (no Prisma) for proxy edge runtime; `auth.ts` (with Prisma adapter) for server actions |
| Resend (email) | Called from Service layer via Resend SDK | Never call from client; invitations only in v1 |
| Vercel | Git-push deploy; environment variables in dashboard | No special integration code needed |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| proxy.ts ↔ Auth.js | `auth()` from `auth.config.ts` (no adapter) | Must use the config-only export at edge; full `auth.ts` is Node-only |
| Server Component ↔ TanStack Query | HydrationBoundary + dehydrate | Prefetch in RSC, hydrate in client; avoids double-fetch on navigation |
| features/ ↔ features/ | Import from the other feature's service or action only | Never import repositories across feature boundaries; go through the service interface |
| editor/ ↔ pages/ | `savePageContent` Server Action is the only bridge | Editor does not know about the page tree; page tree does not know about editor content |

## Sources

- [Notion's Block-Based Data Model](https://www.notion.com/blog/data-model-behind-notion) — HIGH confidence, official Notion engineering blog
- [TipTap Next.js Integration](https://tiptap.dev/docs/editor/getting-started/install/nextjs) — HIGH confidence, official TipTap docs
- [TanStack Query Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates) — HIGH confidence, official TanStack docs
- [Auth.js Protecting Routes](https://authjs.dev/getting-started/session-management/protecting) — HIGH confidence, official Auth.js docs
- [Next.js Multi-Tenant Guide](https://nextjs.org/docs/app/guides/multi-tenant) — HIGH confidence, official Next.js docs
- [TipTap SSR Hydration Issue #5856](https://github.com/ueberdosis/tiptap/issues/5856) — HIGH confidence, upstream bug tracker confirming `immediatelyRender: false` requirement
- [Prisma Recursive Relationships](https://wanago.io/2023/12/11/api-nestjs-sql-recursive-relationships-prisma-postgresql/) — MEDIUM confidence, community article; Prisma CTE limitation verified via GitHub issue [#3725](https://github.com/prisma/prisma/issues/3725)
- [Server Action + TanStack Query pattern](https://reetesh.in/blog/server-action-with-tanstack-query-in-next.js-explained) — MEDIUM confidence, community article consistent with official patterns

---
*Architecture research for: Notion-like block-based productivity app (Notely)*
*Researched: 2026-03-24*
