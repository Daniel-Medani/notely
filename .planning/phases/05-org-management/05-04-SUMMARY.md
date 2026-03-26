---
phase: 05-org-management
plan: "04"
subsystem: ui
tags: [invitation, auth, better-auth, prisma, next.js, callbackUrl]

# Dependency graph
requires:
  - phase: 05-org-management
    provides: "org Server Actions (acceptInvitationAction, getInvitationAction), proxy PUBLIC_ROUTES including /invite"
  - phase: 05-org-management
    provides: "members settings page, role management, member removal"

provides:
  - "Public invitation accept page at /invite/[invitationId] with 5 distinct states"
  - "callbackUrl support on login page — unauthenticated invite clicks redirect back after sign-in"
  - "Phase 5 org management fully verified end-to-end"

affects: [phase-06-page-management, phase-07-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "auth.api.getSession({ headers }) for optional session check on public pages — avoids verifySession() which always redirects"
    - "callbackUrl query param with startsWith('/') security validation — prevents open redirect to external URLs"
    - "Separate prisma.invitation.findUnique + prisma.organization.findUnique — Invitation model has no @relation in schema.prisma"

key-files:
  created:
    - src/app/invite/[invitationId]/page.tsx
    - src/app/invite/[invitationId]/accept-client.tsx
  modified:
    - src/app/(auth)/login/page.tsx
    - src/components/auth/sign-in-form.tsx

key-decisions:
  - "auth.api.getSession used instead of verifySession() on the invite page — verifySession() redirects to /login, breaking the public invite page flow"
  - "Separate prisma queries for invitation lookups — Invitation model has no @relation in schema.prisma, so include: { organization } throws a Prisma error"
  - "callbackUrl validated with startsWith('/') — prevents open redirect attacks while supporting relative-path post-login navigation"

patterns-established:
  - "Public page optional session: use auth.api.getSession({ headers: await headers() }) — never verifySession() on public routes"
  - "Login redirect: pass callbackUrl from Server Component searchParams to client SignInForm, validate with startsWith('/')"

requirements-completed: [ORG-03]

# Metrics
duration: ~30min
completed: 2026-03-26
---

# Phase 5 Plan 04: Invitation Accept Page Summary

**Public invitation accept page with 5 states (valid/signed-out, valid/signed-in, expired, already-member, not-found) and callbackUrl redirect on login for seamless unauthenticated invite acceptance**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-03-26
- **Completed:** 2026-03-26
- **Tasks:** 2 (1 auto + 1 checkpoint verified)
- **Files modified:** 5

## Accomplishments

- Invitation accept page renders correct UI for all 5 states using direct Prisma queries and optional session check via `auth.api.getSession`
- Login page now accepts `callbackUrl` query param and validates it (relative paths only) to redirect back to invite page after sign-in
- All Phase 5 org management features verified end-to-end by user: org switcher, create org, invite member, role change, member removal, invitation accept flow

## Task Commits

Each task was committed atomically:

1. **Task 1: Build invitation accept page and add callbackUrl support to login** - `c942381` (feat)
2. **Fix: replace invitation.organization include with separate query** - `8affaaf` (fix)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/app/invite/[invitationId]/page.tsx` - Public server component, 5-state invite accept page
- `src/app/invite/[invitationId]/accept-client.tsx` - Client component with "Accept Invitation" button calling acceptInvitationAction
- `src/app/(auth)/login/page.tsx` - Reads callbackUrl from searchParams, passes to SignInForm
- `src/components/auth/sign-in-form.tsx` - Accepts callbackUrl prop, validates with startsWith('/'), uses as redirectTo
- `src/lib/actions/org-actions.ts` - Added revalidatePath calls after role change and member removal (deviation fix)
- `src/components/workspace/members-list.tsx` - Wrapped useOptimistic calls in startTransition for React 19 compliance (deviation fix)

## Decisions Made

- Used `auth.api.getSession({ headers: await headers() })` instead of `verifySession()` on the invite page — `verifySession()` always redirects to `/login`, which would break the public invite page for unauthenticated users.
- Performed two separate Prisma queries (invitation + organization) rather than using `include: { organization }` — the Better Auth `Invitation` model has no `@relation` defined in `schema.prisma`, so Prisma `include` throws a type error.
- callbackUrl validated with `startsWith('/')` to ensure only relative paths are accepted, preventing open redirect vulnerabilities.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replace invitation.organization include with separate Prisma query**
- **Found during:** Task 1 (invitation accept page)
- **Issue:** `prisma.invitation.findUnique({ include: { organization: ... } })` threw a TypeScript error because the Better Auth `Invitation` model has no `@relation` defined in `schema.prisma`. The include was structurally invalid.
- **Fix:** Split into two queries — `prisma.invitation.findUnique` followed by `prisma.organization.findUnique` using the `organizationId` from the invitation row.
- **Files modified:** `src/app/invite/[invitationId]/page.tsx`
- **Verification:** TypeScript compile passed, page loaded correctly.
- **Committed in:** `8affaaf`

**2. [Rule 1 - Bug] Wrap useOptimistic calls in startTransition — required by React 19**
- **Found during:** Post-checkpoint verification (05-03 members list)
- **Issue:** React 19 requires state updates from `useOptimistic` to be wrapped in `startTransition`; calling the optimistic updater directly caused a React warning and unreliable optimistic updates.
- **Fix:** Wrapped all `setOptimisticMembers` calls in `startTransition(...)` in MembersList component.
- **Files modified:** `src/components/workspace/members-list.tsx`
- **Verification:** No React warnings, optimistic updates applied correctly.
- **Committed in:** `721f7c2`

**3. [Rule 1 - Bug] Add revalidatePath after member role change and removal**
- **Found during:** Post-checkpoint verification (05-03 members page)
- **Issue:** After a role change or member removal, the server-side data was not revalidated, so a page refresh would show stale member data despite the DB being updated.
- **Fix:** Added `revalidatePath` calls to `changeMemberRoleAction` and `removeMemberAction` in `org-actions.ts`.
- **Files modified:** `src/lib/actions/org-actions.ts`
- **Verification:** Role change and removal reflected correctly on page refresh.
- **Committed in:** `c236887`

---

**Total deviations:** 3 auto-fixed (3 bugs)
**Impact on plan:** All three fixes were required for correctness. Bug 1 was a schema constraint, bugs 2 and 3 were React 19 and Next.js cache invalidation issues in the Phase 5 members page.

## Issues Encountered

- The Better Auth `Invitation` model in Prisma has no explicit `@relation` annotation pointing to `Organization`, so standard Prisma `include` does not work. The fix (separate query) is now a documented pattern in STATE.md.

## User Setup Required

None — no external service configuration required for this plan. Resend integration for invitation emails was completed in Plan 01.

## Next Phase Readiness

- All Phase 5 org management features are complete and verified: org creation, org switching, member invitations, role management, member removal, and invite acceptance.
- Phase 6 (page management / deletion flow) can proceed — org context is stable.
- No blockers.

## Self-Check: PASSED

All created files found on disk. All task commits verified in git history.

---
*Phase: 05-org-management*
*Completed: 2026-03-26*
