# Phase 1: Foundation - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Authentication, tenant isolation, and architecture patterns that every subsequent phase depends on. Users can create accounts (email/password or Google OAuth), sign in, and land in their automatically-created personal organization. All routes are protected — no unauthenticated access. All database tables include `organizationId` for row-level tenant isolation with path-based routing.

</domain>

<decisions>
## Implementation Decisions

### Auth page design
- **D-01:** Separate pages for sign-in (`/login`) and sign-up (`/register`) with cross-links between them
- **D-02:** Centered card layout on a clean background — no split panel or full-page form
- **D-03:** Google OAuth button appears above the email/password form with an "or" divider
- **D-04:** Branding is app name text ("Notely") only — no icon or tagline for v1

### Sign-up flow
- **D-05:** No email verification for v1 — instant access after signup
- **D-06:** Sign-up form fields: email, password, confirm password, and display name (4 fields)
- **D-07:** Password requirement: minimum 8 characters, no complexity rules
- **D-08:** Personal organization auto-created on signup, named "{User's name}'s Workspace"

### Post-auth landing
- **D-09:** After sign-in, users land in the workspace with sidebar + main content area
- **D-10:** Empty workspace shows a welcome message ("Welcome to Notely") with a "New Page" CTA button in the main area
- **D-11:** Sidebar is collapsible via toggle button
- **D-12:** Sidebar contains: Notely logo at top, "Pages" section header with empty state, user avatar/menu at bottom for sign-out

### Error & feedback UX
- **D-13:** Auth errors displayed inline below the relevant form field (red text)
- **D-14:** Loading state: submit button shows spinner and becomes disabled during processing
- **D-15:** After successful sign-up, redirect straight to workspace — no welcome screen, toast, or interstitial

### Claude's Discretion
- Exact spacing, typography, and color choices within shadcn/ui defaults
- Loading skeleton design for initial page load
- Specific error message wording (e.g., "Invalid email or password" vs "Email not found")
- Sign-out confirmation behavior (direct sign-out vs confirm dialog)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above.

Relevant requirements from REQUIREMENTS.md:
- AUTH-01 through AUTH-06 (authentication)
- TNNT-01 through TNNT-04 (tenant isolation)
- SEC-01, SEC-02, SEC-04, SEC-05, SEC-06 (security)
- CICD-01, CICD-02 (CI/CD foundation)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Greenfield project — no existing code. All components built from scratch using shadcn/ui.

### Established Patterns
- Repository pattern: Server Action -> Service -> IRepository -> PrismaRepository (from PROJECT.md)
- Better Auth with Prisma adapter for authentication (not next-auth v5)
- Next.js 16 uses `proxy.ts` / `export function proxy()` — NOT `middleware.ts`
- `@prisma/adapter-neon` WebSocket driver required for Vercel serverless

### Integration Points
- Better Auth route handler at `app/api/auth/[...all]/route.ts`
- Prisma schema defines User, Organization, Member tables with `organizationId` FK
- Path-based tenant resolution via `[org]` route segment
- React Hook Form + Zod for form validation (shared schema pattern)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-24*
