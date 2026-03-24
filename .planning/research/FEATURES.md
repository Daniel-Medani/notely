# Feature Research

**Domain:** Block-based productivity / note-taking app (Notion-like)
**Researched:** 2026-03-24
**Confidence:** HIGH (corroborated by Notion official docs, competitor analysis, user reviews, and TipTap documentation)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Block-based rich text editor | Every Notion-like app has blocks; users have muscle memory for `/` commands and drag handles | HIGH | TipTap covers this. Core block types: paragraph, H1–H3, bullet list, ordered list, to-do, code block, blockquote, divider, image embed |
| Slash command (`/`) block insertion | Users instinctively type `/` to insert blocks — it's the de facto UX pattern for this category | MEDIUM | TipTap has a Slash Commands extension; must show filtered menu on keystroke |
| Drag-and-drop block reordering | Users expect to grab any block and move it; drag handle (`⠿`) is standard | MEDIUM | TipTap DragHandle extension supports this; requires careful z-index / UX polish |
| Block context menu (transform, delete, duplicate) | Right-click or via drag handle; users expect to change block type without retyping | MEDIUM | TipTap DragContextMenu covers transform and block-level ops |
| Keyboard shortcuts for formatting | Bold, italic, underline, inline code via standard shortcuts (Cmd+B, Cmd+I, etc.) | LOW | TipTap supports these out of the box |
| Hierarchical pages (nested page tree) | Core mental model: pages inside pages, visible in sidebar | HIGH | Already in scope. Sidebar tree + path-based navigation |
| Sidebar navigation | Users expect always-visible workspace navigator showing page hierarchy | MEDIUM | Already in scope. Collapsible sidebar with page tree |
| Page create / rename / delete from sidebar | Standard CRUD on the page tree — not just inside the page | MEDIUM | Already in scope via optimistic sidebar operations |
| Page title as the document heading | Title field at top of page, styled prominently, synced to sidebar | LOW | Title is a first-class field, not a heading block |
| Full-text search | Users expect Cmd+K or a search bar to find any page or content instantly | MEDIUM | Already in scope |
| Trash / soft delete with recovery | Accidental deletes are common; users panic if there's no undo at document level | MEDIUM | Already in scope |
| Dark mode | Expected in all modern productivity tools; Notion ships it, users switch immediately | LOW | Already in scope with system-aware toggle |
| Authentication (email + OAuth) | Users expect both email/password and "Sign in with Google" | MEDIUM | Already in scope via Auth.js |
| Empty state / onboarding page | First-time users need a starter page or prompt — blank workspace feels broken | LOW | Auto-create personal org + welcome page addresses this |
| Debounce / auto-save | Users should never have to click Save; content must persist silently | MEDIUM | Already planned (debounce-save for editor) |
| Page emoji icon | Users routinely assign emojis to pages to distinguish them visually in the sidebar | LOW | Not currently scoped. Low effort, high visibility — add emoji picker to page title |
| Breadcrumbs / page path | With nested pages, users need to know where they are; breadcrumbs in header are expected | LOW | Not currently scoped. Simple breadcrumb from root to current page |
| Inline page links (`[[` or `@`) | Users expect to link to other pages inline without leaving the editor | MEDIUM | Not currently scoped. TipTap supports custom mention nodes; strongly expected |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Multi-tenant org management with path-based routing | Most free-tier Notion clones are single-user; org support with `notely.app/[org]` routing appeals to small teams | HIGH | Already in scope. Path-based (not subdomain) to work on Vercel free tier |
| Auto-create personal org on signup | Zero-friction onboarding: user signs up and immediately has a workspace | LOW | Already in scope. Avoids "where do I start?" paralysis |
| Code blocks with syntax highlighting | Free-tier alternatives often omit this or use basic libraries; code-block-lowlight via TipTap is high quality | MEDIUM | Already in scope |
| Role-based org membership (Admin / Member) | Single-user tools lose teams; basic RBAC opens team use cases | MEDIUM | Already in scope |
| Email invitations for org members | Inviting teammates via email is the standard onboarding flow for team tools | MEDIUM | Resend (free tier, 100 emails/day) supports this |
| Rate limiting on auth and write endpoints | Most hobby-tier apps skip this; it signals production-grade reliability | LOW | Already in scope |
| CI/CD with full test coverage (Vitest + Playwright) | Stability and confidence differentiates from low-quality clones | MEDIUM | Already in scope |
| Fast page tree operations (optimistic updates) | Notion's main complaint is slowness with large workspaces; fast sidebar operations are a real differentiator | MEDIUM | Already in scope |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems given the project's constraints.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time collaborative cursors | Notion has it; teams want to co-edit | Requires WebSockets/CRDT infrastructure (Yjs, Liveblocks) — enormous complexity; not free tier compatible at scale | Last-write-wins auto-save is sufficient for v1; add "presence" indicator in v2 |
| Image upload / storage | Users want to paste or drag images directly | Requires S3/Cloudflare R2 or similar — storage costs, upload APIs, CDN; blows through Neon's 0.5 GB limit fast | Image URL embeds cover 90% of the use case for free (paste an Imgur/Unsplash URL) |
| Database views (table, kanban, calendar) | Power users love Notion databases | High UI complexity, separate data model (rows/columns/properties vs. blocks), effectively a product inside a product | Block-based pages cover most lightweight use cases; defer to v2 |
| Page-level permissions / public sharing links | Teams want to share individual pages externally | Requires per-page ACL layer, public token system, anonymous access paths — significant auth complexity on top of org model | Org-level access (all members see all pages) is sufficient for v1 |
| AI features (summarize, generate, rewrite) | AI is expected in every tool now | API costs are not free-tier compatible; adds LLM latency to the editor; distracts from core note-taking quality | Deliver fast, reliable editing first; AI is a v2+ differentiator |
| Subdomain-based tenant routing (`org.notely.app`) | Perceived as more professional | Requires DNS wildcard config — not supported on Vercel hobby plan | Path-based routing (`notely.app/[org]/...`) achieves the same UX, works on Vercel free tier |
| Offline mode / local-first sync | Obsidian users expect it; appeals to privacy-conscious | Requires CRDT or IndexedDB sync engine, conflict resolution, background sync — high complexity; TipTap is not offline-first by default | In-editor debounce-save provides resilience against brief disconnects |
| Mobile app (native iOS/Android) | Users want mobile access | Separate codebase, App Store/Play Store overhead, responsive PWA is faster to ship | Responsive web design works on mobile browsers; PWA install is a v1.x option |
| Tables / toggles / callouts as editor blocks | Feature parity with Notion's full block set | Each block type multiplies editor test surface and TipTap extension work; tables are notoriously complex in ProseMirror | Core block set (headings, lists, to-do, code, blockquote, divider, image) covers 80% of use cases |
| Comments / reactions on blocks | Social annotation layer | Adds a data model (comments table, notification system, mention resolution) that rivals the core editor in complexity | Not needed for a personal/small-team knowledge base in v1 |

---

## Feature Dependencies

```
Authentication (email/password + Google OAuth)
    └──required by──> Org Management
                          └──required by──> Page Tree / Sidebar
                                                └──required by──> Block Editor
                                                                      └──required by──> Full-Text Search
                                                                      └──required by──> Inline Page Links

Org Management
    └──required by──> Member Invite (email)
    └──required by──> Role-based access (Admin / Member)
    └──required by──> Trash / Soft Delete

Block Editor
    └──enhanced by──> Slash Commands
    └──enhanced by──> Drag-and-drop Block Reordering
    └──enhanced by──> Inline Page Links (@-mentions)

Page Emoji Icon ──enhances──> Sidebar (visual navigation)
Breadcrumbs ──requires──> Hierarchical Page Tree

Dark Mode ──independent of──> All other features (CSS/theme layer only)
```

### Dependency Notes

- **Authentication requires completion before all other features:** Every route is protected; nothing is buildable without a working auth layer.
- **Org Management requires Auth:** Organizations are tenant containers scoped to authenticated users; org creation happens on signup.
- **Page Tree requires Org Management:** Every page belongs to an org via `organizationId`; the sidebar query is always org-scoped.
- **Block Editor requires Page Tree:** A page must exist to edit; the editor is always embedded in a page context.
- **Full-Text Search requires Block Editor:** Search indexes page content — content only exists after editor writes.
- **Inline Page Links requires both Block Editor and Page Tree:** The mention picker queries the org's page list; requires pages to exist to link to.
- **Member Invite requires Auth + Org Management + Email (Resend):** Invite flow: admin creates invite → Resend sends email → recipient registers/logs in → joins org.
- **Page Emoji Icon has no hard dependencies:** Can be added at any phase after Page create exists; purely additive.
- **Breadcrumbs has no hard dependencies:** Can be added after hierarchical page tree is working; purely display layer.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [x] Authentication (email/password + Google OAuth) — no authenticated product without it
- [x] Auto-create personal org on signup — zero-friction onboarding
- [x] Org management (create org, invite members via email, roles: Admin/Member) — enables team use case
- [x] Hierarchical pages with sidebar navigation — core organizational model
- [x] Optimistic page-tree operations (create, rename, delete, move) — must feel fast
- [x] Block-based editor (headings, lists, to-do, code with highlight, blockquote, divider, image URL embed) — core content creation
- [x] Slash command (`/`) block insertion — expected UX pattern; absence is jarring
- [x] Drag-and-drop block reordering — expected; absence makes editor feel primitive
- [x] Debounce auto-save — users must never manually save
- [x] Full-text search — content is useless if it can't be found
- [x] Trash / soft delete with recovery — prevents panic on accidental deletion
- [x] Dark mode — expected in 2026; absence is noticed immediately
- [ ] Page emoji icon — low effort, high visual impact; strongly recommended for v1
- [ ] Breadcrumbs in header — low effort; aids navigation in deeply nested trees

### Add After Validation (v1.x)

Features to add once core is working and user patterns are observed.

- [ ] Inline page links (`@page-name` mention) — add when users start requesting cross-page navigation; medium complexity
- [ ] Page cover images (URL-based, no upload) — aesthetic; add when users start customizing pages heavily
- [ ] Keyboard shortcut for moving blocks (Cmd+Shift+Arrow) — add after drag-and-drop is solid
- [ ] Block-level context menu (transform block type via drag handle menu) — adds polish after core editor is stable
- [ ] Responsive layout / PWA manifest — add when mobile usage is observed

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Database views (table, kanban, calendar) — high complexity; wait for user requests
- [ ] Page-level permissions / public sharing links — significant auth complexity; wait for team growth signal
- [ ] Real-time collaboration (presence, cursors) — requires CRDT/WebSockets infrastructure
- [ ] AI features (summarize, generate, rewrite) — defer until core editing quality is validated
- [ ] Additional block types (callout, toggle, table, column layout) — add based on user demand
- [ ] Comments and reactions on blocks — social layer; not needed for personal/small-team tools
- [ ] Native mobile app — web-first approach validated first
- [ ] Offline mode / local-first sync — significant infrastructure; evaluate after v1 performance metrics

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Authentication | HIGH | MEDIUM | P1 |
| Org management + invites | HIGH | HIGH | P1 |
| Hierarchical pages + sidebar | HIGH | HIGH | P1 |
| Block editor (core blocks) | HIGH | HIGH | P1 |
| Slash command insertion | HIGH | MEDIUM | P1 |
| Drag-and-drop block reorder | HIGH | MEDIUM | P1 |
| Debounce auto-save | HIGH | LOW | P1 |
| Full-text search | HIGH | MEDIUM | P1 |
| Trash / soft delete | HIGH | MEDIUM | P1 |
| Dark mode | MEDIUM | LOW | P1 |
| Page emoji icon | MEDIUM | LOW | P1 |
| Breadcrumbs | MEDIUM | LOW | P1 |
| Inline page links (@-mention) | HIGH | MEDIUM | P2 |
| Block context menu (transform) | MEDIUM | MEDIUM | P2 |
| Page cover images (URL) | LOW | LOW | P2 |
| Keyboard shortcuts for blocks | MEDIUM | LOW | P2 |
| Database views | HIGH | HIGH | P3 |
| Real-time collaboration | HIGH | HIGH | P3 |
| AI features | MEDIUM | HIGH | P3 |
| Page-level permissions | MEDIUM | HIGH | P3 |
| Native mobile app | HIGH | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Notion | AppFlowy | AFFiNE | Outline | Notely v1 |
|---------|--------|----------|--------|---------|-----------|
| Block editor | Yes | Yes | Yes | Markdown-only | Yes (TipTap) |
| Slash commands | Yes | Yes | Yes | Yes | Yes |
| Drag-and-drop blocks | Yes | Yes | Yes | Limited | Yes |
| Hierarchical pages | Yes | Yes | Yes | Yes | Yes |
| Full-text search | Yes | Yes | Yes | Yes | Yes |
| Dark mode | Yes | Yes | Yes | Yes | Yes |
| Page emoji icons | Yes | Yes | Yes | Yes | P1 (add to v1) |
| Page covers | Yes | Yes | Yes | No | P2 (v1.x) |
| Inline @-page links | Yes | Yes | Yes | Yes | P2 (v1.x) |
| Backlinks | Yes | Yes | Yes | Partial | No (v2+) |
| Org / multi-tenant | Yes (paid) | No | Workspace-only | Yes | Yes (free, v1) |
| Role-based access | Yes (paid) | No | No | Yes | Yes (Admin/Member, v1) |
| Email invitations | Yes (paid) | No | No | Yes | Yes (v1, Resend) |
| Database views | Yes | Yes | Yes | No | No (v2+) |
| Real-time collab | Yes | Yes | Yes | Yes | No (v2+) |
| AI features | Yes (paid) | Partial | Yes | No | No (v2+) |
| Offline mode | No | Yes | Partial | No | No |
| Free tier | Limited | Yes (self-host) | Yes (self-host) | Yes (self-host) | Yes (hosted) |

**Notely's competitive position:** The combination of a free-tier hosted product with multi-tenant org support, email invites, and role-based access is unusual. Most free-tier competitors are either single-user or self-hosted. This is the primary differentiator to emphasize.

---

## Sources

- [Notion Help: Block basics](https://www.notion.com/help/guides/block-basics-build-the-foundation-for-your-teams-pages) — official feature set reference
- [Notion Help: Slash commands](https://www.notion.com/help/guides/using-slash-commands) — slash command UX pattern
- [Notion Help: Page icons and covers](https://www.notion.com/help/guides/page-icons-and-covers) — page customization expectations
- [Notion Help: Links and backlinks](https://www.notion.com/help/create-links-and-backlinks) — inline page mention behavior
- [Notion Help: Keyboard shortcuts](https://www.notion.com/help/keyboard-shortcuts) — expected keyboard UX
- [TipTap: Drag Handle extension](https://tiptap.dev/docs/editor/extensions/functionality/drag-handle) — implementation feasibility
- [TipTap: Slash Dropdown Menu](https://tiptap.dev/docs/ui-components/components/slash-dropdown-menu) — slash command implementation
- [TipTap: Drag Context Menu](https://tiptap.dev/docs/ui-components/components/drag-context-menu) — block context menu implementation
- [Zapier: Best Notion alternatives 2026](https://zapier.com/blog/best-notion-alternatives/) — competitive landscape
- [Nuclino: 18 Best Notion Alternatives 2026](https://www.nuclino.com/alternatives/notion-alternatives) — competitor feature comparison
- [Herdr Blog: Top 5 Notion complaints 2025](https://blog.herdr.io/work-management/title-top-5-complaints-about-notion-in-2025-what-users-are-saying/) — pain points driving alternatives
- [Open Source Notion Alternatives 2026](https://openalternative.co/alternatives/notion) — OSS competitor feature sets
- [MakeUseOf: Best block-based editors](https://www.makeuseof.com/best-block-based-editors-note-taking/) — block editor UX expectations

---

*Feature research for: Block-based productivity app (Notion-like, multi-tenant, free-tier hosted)*
*Researched: 2026-03-24*
