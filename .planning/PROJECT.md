# Notely

## What This Is

Notely is a Notion-inspired productivity app for organizing notes, documents, and tasks in a flexible, block-based workspace. Users can build their own knowledge base with a clean, minimal interface. Built for individual users and small teams who want a self-organized workspace without the complexity or cost of enterprise tools.

## Core Value

Users can create, organize, and find their content in a block-based editor with nested pages — fast, reliable, and free to run.

## Requirements

### Validated

- [x] Dark mode with system-aware theme toggle — Validated in Phase 7: Polish and CI/CD
- [x] Rate limiting on auth and write endpoints — Validated in Phase 7: Polish and CI/CD
- [x] CI/CD pipeline (ESLint, Prettier, TypeScript check, Vitest, Playwright) on every PR — Validated in Phase 7: Polish and CI/CD
- [x] Tenant isolation via shared DB with row-level scoping — Validated in Phase 7: Polish and CI/CD (cross-tenant integration tests)

### Active

- [ ] Block-based rich text editor (headings, lists, to-dos, code blocks with syntax highlighting, blockquotes, dividers, image URL embeds)
- [ ] Hierarchical pages with nested page tree and sidebar navigation
- [ ] Optimistic page-tree operations (create, rename, delete, move) with debounce-save for editor content
- [ ] Authentication with email/password and Google OAuth
- [ ] Full-text search across all pages
- [x] Trash / soft deletes with recovery — Validated in Phase 6: Trash
- [ ] Multi-tenant org management (create org, invite members, accept invitations, remove members, manage roles)
- [ ] Auto-create personal org on signup for zero-friction onboarding
- [ ] Path-based tenant resolution (notely.app/[org]/...)
- [ ] Role-based access within org (Admin, Member) — all members see all pages within org
- [ ] Input validation with Zod on all server-side endpoints

### Out of Scope

- Real-time multiplayer / collaborative cursors — high complexity, not core to v1 value
- Database views (tables, kanban, calendar) — significant UI complexity, defer to v2+
- Page-level permissions — v2 feature (per-page sharing, public links)
- AI features — not core to note-taking value prop
- Mobile app — web-first, mobile later
- Image upload/storage — URL embeds only for v1 (avoids storage costs)
- Tables, toggles, callouts in editor — added editor complexity for low v1 value
- Subdomain-based tenant resolution — requires DNS wildcard, incompatible with Vercel free tier

## Context

**Tech Stack (all free tier):**
- Next.js (App Router) + TypeScript
- PostgreSQL via Neon (free tier, 0.5 GB)
- Prisma ORM
- Auth.js (NextAuth v5)
- TipTap editor with code-block-lowlight for syntax highlighting
- Tailwind CSS + shadcn/ui
- TanStack Query for server state
- Resend for email (free tier, 100 emails/day)
- Vercel for deployment (free hobby plan)
- Docker Compose for local dev DB
- GitHub Actions for CI/CD

**Architecture:**
- Feature-based project structure (src/features/auth/, pages/, orgs/, editor/, search/)
- Repository pattern: API/Server Action → Service → IRepository (interface) → PrismaRepository
- Server Actions for all mutations; Route Handlers only for webhooks/external integrations
- Typed errors in repositories, domain-specific results in services, consistent error shapes at API layer
- SOLID principles throughout

**Testing Strategy:**
- Services: Vitest + mock repositories (highest priority)
- Repositories: Vitest + real PostgreSQL (no mocks — catches migration issues)
- UI: Vitest + Testing Library (complex/reusable components only)
- E2E: Playwright (auth, CRUD, search flows)
- TDD for all service and repository methods

**Security:**
- Every route and API endpoint protected with auth + authorization
- Zod validation on all server-side input
- Prisma prevents SQL injection (no raw SQL with user input)
- TipTap content sanitized before render and storage
- CSRF handled by Auth.js
- No secrets in client bundles
- OWASP Top 10 review per feature

## Constraints

- **Budget**: All tools must have free tier — no credit card required for full stack locally or in production
- **Tech Stack**: Next.js App Router + TypeScript + PostgreSQL + Prisma + Auth.js + TipTap + Tailwind/shadcn + TanStack Query
- **Deployment**: Vercel free tier (hobby plan)
- **Database**: Neon free tier (0.5 GB storage limit)
- **Email**: Resend free tier (100 emails/day)
- **Multi-tenancy**: Shared database, row-level isolation with organizationId FK on every table
- **Tenant resolution**: Path-based only (notely.app/[org]/...) — no subdomain routing
- **Branching**: feat → development → main; both main and development require all 3 CI checks to pass
- **Next.js**: Always read node_modules/next/dist/docs/ before writing or reviewing Next.js code; Next.js 16 uses proxy.ts / export function proxy(), not middleware.ts

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| URL image embeds only (no upload) | Zero storage cost, simpler architecture for v1 | — Pending |
| Auto-create personal org on signup | Zero-friction onboarding, avoids empty state | — Pending |
| Optimistic updates on page-tree only, debounce-save for editor | TipTap is local-first by nature; optimistic layer only needed for sidebar operations | — Pending |
| Org-level roles only (Admin, Member) | Page-level permissions deferred to v2; simplifies auth model | — Pending |
| Path-based tenant resolution | Works on Vercel free tier without DNS wildcard | — Pending |
| Code blocks with syntax highlighting | Client-side only (TipTap extension), zero cost, plain blocks feel unfinished | — Pending |
| Basic block set for v1 (no tables/toggles/callouts) | Reduces editor complexity; covers core note-taking needs | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-27 — Phase 7 (Polish and CI/CD) complete — final phase of v1.0 milestone*
