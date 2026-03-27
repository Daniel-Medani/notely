# Roadmap: Notely

## Overview

Notely is built in seven phases that follow a strict dependency chain: authentication and tenant isolation first (nothing works without them), then the page tree (content needs somewhere to live), then the block editor (the core product experience), then search (content must be findable), then org management (teams need somewhere to collaborate), then trash (accidents need recovery), and finally polish, security hardening, and the full CI/CD test suite. Each phase delivers a coherent, verifiable capability that the next phase builds on.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Authentication, tenant isolation, and architecture patterns that every subsequent phase depends on (completed 2026-03-25)
- [x] **Phase 2: Page Tree** - Hierarchical page management with an optimistic sidebar and breadcrumb navigation (completed 2026-03-25)
- [ ] **Phase 3: Block Editor** - Full TipTap block editor with auto-save, slash commands, and drag-and-drop reordering
- [x] **Phase 4: Search** - Full-text search across all pages in the current organization via PostgreSQL FTS (completed 2026-03-26)
- [x] **Phase 5: Org Management** - Organization creation, email invitations, role-based membership, and org switching (completed 2026-03-26)
- [x] **Phase 6: Trash** - Soft delete with trash drawer, restore, and permanent deletion (completed 2026-03-26)
- [ ] **Phase 7: Polish and CI/CD** - Dark mode, rate limiting, full Vitest and Playwright suites, CI/CD pipeline hardening

## Phase Details

### Phase 1: Foundation
**Goal**: Users can securely create accounts, sign in, and land in their personal organization — with the architectural patterns that protect every feature that follows locked in from the start
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, TNNT-01, TNNT-02, TNNT-03, TNNT-04, SEC-01, SEC-02, SEC-04, SEC-05, SEC-06, CICD-01, CICD-02
**Success Criteria** (what must be TRUE):
  1. User can create an account with email and password, sign in, and stay signed in across browser refreshes
  2. User can sign in with Google OAuth and land in their workspace
  3. A personal organization is automatically created for every new user with that user as Admin — no setup required
  4. Navigating to any route without a session redirects to the sign-in page; no unauthenticated data is accessible
  5. All database tables include an `organizationId` foreign key and all queries are path-scoped to the current org — no cross-tenant data is accessible
**Plans:** 5/5 plans complete

Plans:
- [x] 01-01-PLAN.md — Project scaffolding, Prisma schema, CI workflow, test configs
- [x] 01-02-PLAN.md — Auth backend: Better Auth, Prisma client, DAL, proxy.ts, Zod schemas
- [x] 01-03-PLAN.md — Auth UI: sign-in and sign-up pages with forms
- [x] 01-04-PLAN.md — Tenant resolution, workspace shell, sidebar, repository interfaces
- [x] 01-05-PLAN.md — Root layout providers, schema tests, visual verification checkpoint

**UI hint**: yes

### Phase 2: Page Tree
**Goal**: Users can create, organize, and navigate an unlimited hierarchy of pages from the sidebar with instant, optimistic feedback
**Depends on**: Phase 1
**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04, PAGE-05, PAGE-06, PAGE-07, PAGE-08, PAGE-09, PAGE-10
**Success Criteria** (what must be TRUE):
  1. User can create a new page and see it appear in the sidebar immediately (optimistic) before the server confirms
  2. User can rename, delete, and move pages in the sidebar with instant UI feedback and no loading spinners
  3. User can nest pages arbitrarily deep and the sidebar reflects the full tree for the current organization
  4. Every page displays its breadcrumb trail from root to current page and an optional emoji icon in both the sidebar and the page header
  5. The page title in the header is synchronized with the sidebar label
**Plans:** 4/4 plans complete

Plans:
- [x] 02-01-PLAN.md — Prisma Page model, Zod schemas, buildPageTree + buildBreadcrumb utilities (TDD)
- [x] 02-02-PLAN.md — IPageRepository, PrismaPageRepository, PageService, Server Actions, QueryProvider
- [x] 02-03-PLAN.md — Sidebar page tree UI, HydrationBoundary, optimistic mutations, WorkspaceContext
- [x] 02-04-PLAN.md — Page view route, breadcrumb header, emoji picker, editable title, visual checkpoint

**UI hint**: yes

### Phase 3: Block Editor
**Goal**: Users can write and organize rich content in a block-based editor that saves automatically and never loses work
**Depends on**: Phase 2
**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05, EDIT-06, EDIT-07, EDIT-08, EDIT-09, EDIT-10
**Success Criteria** (what must be TRUE):
  1. User can type content using headings, bullet lists, numbered lists, to-do checkboxes, code blocks with syntax highlighting, blockquotes, dividers, and image URL embeds
  2. User can insert any block type via a slash command (`/`) menu and reorder blocks by dragging
  3. Editor content saves automatically via debounce — no manual save button exists — and content is not lost when the tab is closed
  4. Standard keyboard shortcuts (Cmd+B, Cmd+I, Cmd+U, etc.) apply formatting as expected
  5. Content is stored as JSON and sanitized before storage — no `javascript:` URLs can be injected via link or image embeds
**Plans:** 2/3 plans executed

Plans:
- [x] 03-01-PLAN.md — TDD: sanitizeContent, pageContentSchema, PageService.updateContent, updatePageContentAction
- [x] 03-02-PLAN.md — Install TipTap packages, editor CSS, slash command extension and list component
- [ ] 03-03-PLAN.md — BlockEditor component with autosave, wire into page route, visual checkpoint

**UI hint**: yes

### Phase 4: Search
**Goal**: Users can find any page or content across their organization in under a second using full-text search
**Depends on**: Phase 3
**Requirements**: SRCH-01, SRCH-02, SRCH-03
**Success Criteria** (what must be TRUE):
  1. User can open a search bar via Cmd+K or a visible search control and type a query
  2. Search results show matching page titles and content excerpts from pages in the current organization only
  3. Search returns results quickly using a PostgreSQL GIN index — no sequential scans on the pages table
**Plans:** 2/2 plans complete

Plans:
- [x] 04-01-PLAN.md — TDD: search schema, repository, service, server action, GIN index migration
- [x] 04-02-PLAN.md — SearchPalette UI component, sidebar integration, visual checkpoint

**UI hint**: yes

### Phase 5: Org Management
**Goal**: Users can create organizations, invite members by email, and manage roles — enabling small teams to share a workspace
**Depends on**: Phase 4
**Requirements**: ORG-01, ORG-02, ORG-03, ORG-04, ORG-05, ORG-06, ORG-07, ORG-08
**Success Criteria** (what must be TRUE):
  1. User can create a new organization and become its Admin
  2. Admin can invite a user by email address; the invited user receives an email and can accept the invitation to join the org
  3. Admin can remove a member or change their role (Admin / Member); all role changes take effect immediately on the next request
  4. All members of an organization can view all pages within it; no member can view pages in an organization they do not belong to
  5. User can switch between organizations they belong to and the workspace updates to show that org's content
**Plans:** 4/4 plans complete

Plans:
- [x] 05-01-PLAN.md — TDD: Zod schemas, auth.ts config (creatorRole + sendInvitationEmail), proxy.ts update, Server Actions
- [x] 05-02-PLAN.md — Org switcher popover, create org dialog, wire into sidebar and layout
- [x] 05-03-PLAN.md — Settings/members page, invite form, member list with role management
- [x] 05-04-PLAN.md — Invitation accept page, visual verification checkpoint

**UI hint**: yes

### Phase 6: Trash
**Goal**: Users can recover from accidental deletions — deleted pages are soft-deleted and restorable until explicitly purged
**Depends on**: Phase 5
**Requirements**: TRSH-01, TRSH-02, TRSH-03, TRSH-04
**Success Criteria** (what must be TRUE):
  1. Deleting a page moves it to trash — it disappears from the sidebar and search but is not permanently removed
  2. User can view all trashed pages for the current organization in a dedicated trash view
  3. User can restore a trashed page and it reappears in the sidebar at its original location
  4. User can permanently delete a trashed page and it is gone from the database
**Plans:** 3/3 plans complete

Plans:
- [x] 06-01-PLAN.md — TDD: IPageRepository extension, PageService trash lifecycle (cascade delete, restore, permanent delete, empty trash)
- [x] 06-02-PLAN.md — Zod schemas, Server Actions, and action tests for trash operations
- [x] 06-03-PLAN.md — Trash UI: route page, TrashList component, sidebar link, visual checkpoint

**UI hint**: yes

### Phase 7: Polish and CI/CD
**Goal**: The application is hardened with rate limiting, dark mode, full test coverage, and a passing CI/CD pipeline — ready for production
**Depends on**: Phase 6
**Requirements**: SEC-03, THEME-01, THEME-02, CICD-03, CICD-04, CICD-05
**Success Criteria** (what must be TRUE):
  1. User can toggle between light and dark mode; the app defaults to system preference on first load
  2. Auth and write endpoints reject excessive requests (rate limiting active on all auth and mutation Server Actions via Upstash)
  3. All Vitest unit and integration tests pass, including two-tenant cross-isolation tests that verify no cross-tenant data access
  4. All Playwright E2E tests pass covering auth, page CRUD, editor save, search, and trash recovery flows
  5. Every pull request to development and main requires all CI checks (lint, typecheck, unit tests, E2E) to pass before merge
**Plans:** 3/4 plans executed

Plans:
- [x] 07-01-PLAN.md — Dark mode toggle: ThemeToggle component + sidebar integration
- [x] 07-02-PLAN.md — Rate limiting: Upstash ratelimit module + apply to all mutation Server Actions
- [x] 07-03-PLAN.md — Vitest cross-tenant isolation tests for PrismaPageRepository
- [x] 07-04-PLAN.md — Playwright E2E test suite + GitHub Actions e2e job + CI hardening

**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 5/5 | Complete    | 2026-03-25 |
| 2. Page Tree | 4/4 | Complete   | 2026-03-25 |
| 3. Block Editor | 2/3 | In Progress|  |
| 4. Search | 2/2 | Complete   | 2026-03-26 |
| 5. Org Management | 4/4 | Complete   | 2026-03-26 |
| 6. Trash | 3/3 | Complete   | 2026-03-26 |
| 7. Polish and CI/CD | 3/4 | In Progress|  |
