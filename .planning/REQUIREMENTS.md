# Requirements: Notely

**Defined:** 2026-03-24
**Core Value:** Users can create, organize, and find their content in a block-based editor with nested pages — fast, reliable, and free to run.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can create account with email and password
- [ ] **AUTH-02**: User can sign in with email and password
- [ ] **AUTH-03**: User can sign in with Google OAuth
- [ ] **AUTH-04**: User session persists across browser refresh
- [ ] **AUTH-05**: Personal organization is auto-created on signup with user as Admin
- [ ] **AUTH-06**: Every route and API endpoint requires authentication (no public access)

### Pages

- [ ] **PAGE-01**: User can create a new page within the current organization
- [ ] **PAGE-02**: User can rename a page from the sidebar
- [ ] **PAGE-03**: User can delete a page (moves to trash)
- [ ] **PAGE-04**: User can move a page to become a child of another page
- [ ] **PAGE-05**: Pages support unlimited nesting depth (pages within pages)
- [ ] **PAGE-06**: Sidebar displays the full page tree for the current organization
- [ ] **PAGE-07**: Page tree operations (create, rename, delete, move) are optimistic with instant UI feedback
- [ ] **PAGE-08**: User can assign an emoji icon to a page (displayed in sidebar and page header)
- [ ] **PAGE-09**: Breadcrumb trail shows the path from root to current page in the page header
- [ ] **PAGE-10**: Page title is displayed as the document heading and synced to sidebar

### Editor

- [ ] **EDIT-01**: User can edit page content using a block-based rich text editor (TipTap)
- [ ] **EDIT-02**: Editor supports paragraph, heading (H1-H3), bullet list, numbered list, and to-do list blocks
- [ ] **EDIT-03**: Editor supports code blocks with syntax highlighting
- [ ] **EDIT-04**: Editor supports blockquote, divider, and image URL embed blocks
- [ ] **EDIT-05**: User can insert blocks via slash command (`/`) menu with filtered options
- [ ] **EDIT-06**: User can drag and drop blocks to reorder them within a page
- [ ] **EDIT-07**: Editor content auto-saves via debounce (no manual save button)
- [ ] **EDIT-08**: Editor content is stored as JSON (TipTap `getJSON()`)
- [ ] **EDIT-09**: Standard keyboard shortcuts work for formatting (Cmd+B, Cmd+I, Cmd+U, etc.)
- [ ] **EDIT-10**: Editor content is sanitized before storage (no `javascript:` URLs in links)

### Search

- [ ] **SRCH-01**: User can search across all pages in the current organization via a search bar or Cmd+K
- [ ] **SRCH-02**: Search results show matching page titles and content excerpts
- [ ] **SRCH-03**: Search uses PostgreSQL full-text search with GIN index

### Trash

- [ ] **TRSH-01**: Deleted pages are soft-deleted (moved to trash, not permanently removed)
- [ ] **TRSH-02**: User can view all trashed pages for the current organization
- [ ] **TRSH-03**: User can restore a trashed page to its original location
- [ ] **TRSH-04**: User can permanently delete a trashed page

### Organization

- [ ] **ORG-01**: User can create a new organization
- [ ] **ORG-02**: User can invite members to an organization via email (Resend)
- [ ] **ORG-03**: Invited user can accept an invitation and join the organization
- [ ] **ORG-04**: Admin can remove a member from the organization
- [ ] **ORG-05**: Organization has two roles: Admin and Member
- [ ] **ORG-06**: Admin can change a member's role
- [ ] **ORG-07**: All members can view all pages within the organization (org-level access)
- [ ] **ORG-08**: User can switch between organizations they belong to

### Tenant Isolation

- [x] **TNNT-01**: Every database table includes an `organizationId` foreign key
- [ ] **TNNT-02**: All queries are scoped to the current organization (no cross-tenant data access)
- [ ] **TNNT-03**: Tenant is resolved via path-based routing (`/[org]/...`)
- [ ] **TNNT-04**: Repository interfaces require `organizationId` as a parameter on all methods

### Security

- [ ] **SEC-01**: All user input is validated server-side with Zod before touching the database
- [x] **SEC-02**: All database queries go through Prisma (no raw SQL with user input)
- [ ] **SEC-03**: Auth and write endpoints are rate-limited (Upstash Redis)
- [x] **SEC-04**: No secrets are exposed in client bundles
- [ ] **SEC-05**: Server Actions are wrapped with authentication and authorization checks
- [ ] **SEC-06**: API layer returns consistent error shapes without leaking stack traces

### Theme

- [ ] **THEME-01**: User can toggle between light and dark mode
- [ ] **THEME-02**: Theme defaults to system preference

### CI/CD

- [x] **CICD-01**: GitHub Actions runs ESLint + Prettier check on every PR
- [x] **CICD-02**: GitHub Actions runs TypeScript type check on every PR
- [ ] **CICD-03**: GitHub Actions runs Vitest unit and integration tests on every PR
- [ ] **CICD-04**: GitHub Actions runs Playwright E2E tests on every PR
- [ ] **CICD-05**: All checks must pass before merge to development and main

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Inline Linking

- **LINK-01**: User can link to other pages inline via `@` mention
- **LINK-02**: Mention picker shows filtered list of pages in the current org

### Page Customization

- **CUST-01**: User can add a cover image to a page (URL-based)
- **CUST-02**: Block-level context menu for transforming block types

### Permissions

- **PERM-01**: Admin can set per-page permissions (view, edit)
- **PERM-02**: User can share a page via public link

### Collaboration

- **COLLAB-01**: Users can see who else is viewing a page (presence indicator)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time multiplayer / collaborative cursors | Requires CRDT/WebSocket infrastructure — enormous complexity, not free-tier compatible at scale |
| Database views (table, kanban, calendar) | Effectively a product within a product — high UI complexity, separate data model |
| AI features (summarize, generate, rewrite) | API costs not free-tier compatible; distracts from core editing quality |
| Mobile native app | Web-first; responsive design covers mobile browsers |
| Image upload / storage | Storage costs blow through Neon's 0.5 GB; URL embeds cover 90% of use cases for free |
| Subdomain-based tenant routing | Requires DNS wildcard — not supported on Vercel hobby plan |
| Offline mode / local-first sync | Requires CRDT or IndexedDB sync engine — high complexity |
| Tables / toggles / callouts as editor blocks | Each multiplies editor test surface; core block set covers 80% of use cases |
| Comments / reactions on blocks | Adds data model rivaling core editor complexity; not needed for personal/small-team v1 |
| OAuth providers beyond Google | Email/password + Google sufficient for v1; can add GitHub, Apple later |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Pending |
| PAGE-01 | Phase 2 | Pending |
| PAGE-02 | Phase 2 | Pending |
| PAGE-03 | Phase 2 | Pending |
| PAGE-04 | Phase 2 | Pending |
| PAGE-05 | Phase 2 | Pending |
| PAGE-06 | Phase 2 | Pending |
| PAGE-07 | Phase 2 | Pending |
| PAGE-08 | Phase 2 | Pending |
| PAGE-09 | Phase 2 | Pending |
| PAGE-10 | Phase 2 | Pending |
| EDIT-01 | Phase 3 | Pending |
| EDIT-02 | Phase 3 | Pending |
| EDIT-03 | Phase 3 | Pending |
| EDIT-04 | Phase 3 | Pending |
| EDIT-05 | Phase 3 | Pending |
| EDIT-06 | Phase 3 | Pending |
| EDIT-07 | Phase 3 | Pending |
| EDIT-08 | Phase 3 | Pending |
| EDIT-09 | Phase 3 | Pending |
| EDIT-10 | Phase 3 | Pending |
| SRCH-01 | Phase 4 | Pending |
| SRCH-02 | Phase 4 | Pending |
| SRCH-03 | Phase 4 | Pending |
| TRSH-01 | Phase 6 | Pending |
| TRSH-02 | Phase 6 | Pending |
| TRSH-03 | Phase 6 | Pending |
| TRSH-04 | Phase 6 | Pending |
| ORG-01 | Phase 5 | Pending |
| ORG-02 | Phase 5 | Pending |
| ORG-03 | Phase 5 | Pending |
| ORG-04 | Phase 5 | Pending |
| ORG-05 | Phase 5 | Pending |
| ORG-06 | Phase 5 | Pending |
| ORG-07 | Phase 5 | Pending |
| ORG-08 | Phase 5 | Pending |
| TNNT-01 | Phase 1 | Complete |
| TNNT-02 | Phase 1 | Pending |
| TNNT-03 | Phase 1 | Pending |
| TNNT-04 | Phase 1 | Pending |
| SEC-01 | Phase 1 | Pending |
| SEC-02 | Phase 1 | Complete |
| SEC-03 | Phase 7 | Pending |
| SEC-04 | Phase 1 | Complete |
| SEC-05 | Phase 1 | Pending |
| SEC-06 | Phase 1 | Pending |
| THEME-01 | Phase 7 | Pending |
| THEME-02 | Phase 7 | Pending |
| CICD-01 | Phase 1 | Complete |
| CICD-02 | Phase 1 | Complete |
| CICD-03 | Phase 7 | Pending |
| CICD-04 | Phase 7 | Pending |
| CICD-05 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 58 total
- Mapped to phases: 58
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-24 after roadmap creation — all 58 requirements mapped*
