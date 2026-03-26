---
phase: 05-org-management
plan: 01
subsystem: auth
tags: [better-auth, organization, zod, server-actions, resend, tdd, vitest]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Better Auth setup, auth.ts, proxy.ts, AppError/ActionResult pattern, verifySession DAL
  - phase: 02-page-tree
    provides: assertMembership pattern in page-actions.ts, constants.ts structure

provides:
  - Zod schemas for all org operations (create, invite, role change, remove member)
  - Server Actions for org lifecycle (create, invite, remove, role update, accept invitation, get invitation)
  - Better Auth org plugin updated with creatorRole:'admin' and Resend invitation emails
  - proxy.ts updated with /invite as public route
  - constants.ts ORGS_QUERY_KEY and MEMBERS_QUERY_KEY factories
  - badge, select, alert-dialog shadcn/ui components

affects: [05-org-management-ui, 06-trash, 07-dark-mode]

# Tech tracking
tech-stack:
  added: [resend@6.9.4, shadcn/ui badge, shadcn/ui select, shadcn/ui alert-dialog]
  patterns:
    - assertAdminMembership pattern for admin-only server actions
    - Separate prisma queries instead of include on models without @relation
    - next/headers mock in vitest for Server Action tests
    - Dynamic import of resend in sendInvitationEmail (avoids cold-start cost)

key-files:
  created:
    - src/lib/schemas/org.ts
    - src/lib/schemas/org.test.ts
    - src/lib/actions/org-actions.ts
    - src/lib/actions/org-actions.test.ts
    - src/components/ui/badge.tsx
    - src/components/ui/select.tsx
    - src/components/ui/alert-dialog.tsx
  modified:
    - src/lib/auth.ts
    - src/proxy.ts
    - src/lib/constants.ts
    - package.json

key-decisions:
  - "Separate prisma queries for invitation lookups — Invitation model has no @relation to organization/user in schema.prisma, so include fails; separate findUnique calls work correctly"
  - "Mock next/headers in vitest for Server Action tests — headers() throws outside request scope; vi.mock('next/headers') resolves this"
  - "Dynamic import of Resend in sendInvitationEmail — avoids importing resend at module load time; only loads when email is actually needed"
  - "assertAdminMembership checks role 'admin' OR 'owner' — owner is still valid for admin operations even though UI only exposes admin/member"

patterns-established:
  - "assertAdminMembership pattern: findFirst for member, check role !== admin && role !== owner, throw FORBIDDEN"
  - "Org action pattern: verifySession -> Zod parse -> assertAdminMembership -> auth.api.* call -> return ActionResult"
  - "getInvitationAction is public (no verifySession) — used on /invite page before user authenticates"

requirements-completed: [ORG-01, ORG-02, ORG-03, ORG-04, ORG-05, ORG-06, ORG-07]

# Metrics
duration: 5min
completed: 2026-03-26
---

# Phase 5 Plan 1: Org Management Backend Stack Summary

**Better Auth org plugin with Resend invitation emails, 4 Zod schemas, 6 Server Actions (admin-guarded), /invite public route, 35 passing unit tests**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-26T15:12:06Z
- **Completed:** 2026-03-26T15:17:30Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Complete org management Server Action surface: create org, invite member, remove member, update role, accept invitation, get invitation details
- TDD with 35 tests total (18 schema + 17 action) — all passing, no regressions
- Better Auth org plugin configured with `creatorRole: 'admin'` and `sendInvitationEmail` using Resend with graceful skip when `RESEND_API_KEY` not set
- proxy.ts `/invite` public route added — unauthenticated users can access invitation acceptance page
- ORG-07 access control verified: regular members pass membership check, non-members blocked with FORBIDDEN

## Task Commits

Each task was committed atomically:

1. **Task 1: Install deps, update auth.ts + proxy.ts, create Zod schemas with tests** - `6d47664` (feat)
2. **Task 2: Create org Server Actions with tests (including ORG-07 access control)** - `f6868ba` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified

- `src/lib/schemas/org.ts` - Zod schemas: orgCreateSchema, orgInviteSchema, orgMemberRoleSchema, orgRemoveMemberSchema
- `src/lib/schemas/org.test.ts` - 18 schema validation tests
- `src/lib/actions/org-actions.ts` - 6 Server Actions with assertAdminMembership guard
- `src/lib/actions/org-actions.test.ts` - 17 action tests including ORG-07 access control
- `src/lib/auth.ts` - Added creatorRole:'admin', sendInvitationEmail with Resend
- `src/proxy.ts` - Added /invite to PUBLIC_ROUTES
- `src/lib/constants.ts` - Added ORGS_QUERY_KEY and MEMBERS_QUERY_KEY
- `src/components/ui/badge.tsx` - shadcn/ui Badge component
- `src/components/ui/select.tsx` - shadcn/ui Select component
- `src/components/ui/alert-dialog.tsx` - shadcn/ui AlertDialog component
- `package.json` - Added resend@6.9.4

## Decisions Made

- **Separate prisma queries for invitations:** Invitation model has no `@relation` in schema.prisma (organizationId/inviterId are plain strings); `include` fails at compile time. Used separate `findUnique` calls for org and user lookups.
- **Mock next/headers in vitest:** `headers()` throws outside request scope in Vitest. Added `vi.mock('next/headers', () => ({ headers: vi.fn().mockResolvedValue(new Headers()) }))` — established pattern for all future Server Action tests.
- **Dynamic import of Resend:** `sendInvitationEmail` uses `const { Resend } = await import('resend')` to avoid loading the SDK at module initialization time.
- **assertAdminMembership allows 'owner' role:** Owners can perform admin actions — this is consistent with Better Auth's role hierarchy.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript errors from Prisma include on models without @relation**
- **Found during:** Task 2 (org-actions.ts implementation)
- **Issue:** `prisma.invitation.findUnique({ include: { organization: ..., inviter: ... } })` caused TS errors because Invitation model has no `@relation` directives in schema.prisma
- **Fix:** Replaced `include` with separate `prisma.organization.findUnique` and `prisma.user.findUnique` calls after the initial invitation lookup
- **Files modified:** src/lib/actions/org-actions.ts, src/lib/actions/org-actions.test.ts
- **Verification:** `npx tsc --noEmit` exits 0; all 17 action tests pass
- **Committed in:** f6868ba (Task 2 commit)

**2. [Rule 3 - Blocking] Added next/headers mock to action tests**
- **Found during:** Task 2 (org-actions.test.ts execution)
- **Issue:** `headers()` from `next/headers` throws "called outside a request scope" in Vitest
- **Fix:** Added `vi.mock('next/headers', () => ({ headers: vi.fn().mockResolvedValue(new Headers()) }))` to test file
- **Files modified:** src/lib/actions/org-actions.test.ts
- **Verification:** All 17 tests pass
- **Committed in:** f6868ba (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug fix, 1 blocking issue)
**Impact on plan:** Both essential for type-safety and test execution. No scope creep.

## Issues Encountered

- Prisma Invitation model has no relational fields (`@relation`) in schema.prisma — only plain string FKs. This is correct for Better Auth's managed schema but means no Prisma-level joins on invitation. Workaround: separate queries. This is not a blocker but should be noted for future phases that need invitation data with joins.

## User Setup Required

External services require configuration before invitation emails work in production:

| Environment Variable | Source | Required? |
|---------------------|--------|-----------|
| `RESEND_API_KEY` | Resend Dashboard → API Keys → Create API Key | Yes (for invitation emails) |

Note: `RESEND_API_KEY` absence is handled gracefully — a console.warn is emitted and the email is skipped. Invitations still work (they appear in the DB), but no email is sent.

## Known Stubs

None — all server actions are fully implemented with real auth.api calls and proper error handling.

## Next Phase Readiness

- All 6 Server Actions ready for UI consumption (Phase 5 plans 02-04)
- Admin-only guards tested and verified
- ORG-07 access control verified and documented
- Invitation email flow needs `RESEND_API_KEY` in production `.env`

---
*Phase: 05-org-management*
*Completed: 2026-03-26*

## Self-Check: PASSED

- FOUND: src/lib/schemas/org.ts
- FOUND: src/lib/schemas/org.test.ts
- FOUND: src/lib/actions/org-actions.ts
- FOUND: src/lib/actions/org-actions.test.ts
- FOUND: .planning/phases/05-org-management/05-01-SUMMARY.md
- FOUND: commit 6d47664 (Task 1)
- FOUND: commit f6868ba (Task 2)
