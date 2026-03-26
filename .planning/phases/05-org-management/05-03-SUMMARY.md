---
phase: 05-org-management
plan: "03"
subsystem: org-management
tags: [settings, members, invite, roles, admin, ui]
dependency_graph:
  requires: ["05-01"]
  provides: ["settings/members page", "MembersList component", "InviteMemberForm component", "sidebar Settings link"]
  affects: ["sidebar", "org-management"]
tech_stack:
  added: []
  patterns: ["useOptimistic for member list", "AlertDialog for destructive confirmation", "RHF+Zod for invite form", "Server Component with auth.api.listMembers"]
key_files:
  created:
    - src/app/[org]/settings/members/page.tsx
    - src/components/workspace/members-list.tsx
    - src/components/workspace/invite-member-form.tsx
  modified:
    - src/components/workspace/sidebar.tsx
decisions:
  - "useOptimistic used for member list — avoids TanStack Query since this page is server-rendered and list is passed as props"
  - "user.image typed as optional (string | undefined) in Member interface to match Better Auth listMembers response type"
metrics:
  duration: "2 minutes"
  completed: "2026-03-26T15:27:05Z"
  tasks: 2
  files: 4
---

# Phase 05 Plan 03: Members Settings Page Summary

Settings page at `/${orgSlug}/settings/members` with invite form, member role badges, optimistic role changes, and remove member confirmation — wired to the existing org-actions Server Actions from Plan 01.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create settings/members page, MembersList and InviteMemberForm | 5bdbe03 | src/app/[org]/settings/members/page.tsx, src/components/workspace/members-list.tsx, src/components/workspace/invite-member-form.tsx |
| 2 | Add Settings link to sidebar | 674a859 | src/components/workspace/sidebar.tsx |

## What Was Built

**`src/app/[org]/settings/members/page.tsx`** — Server Component that:
- Verifies session via `verifySession()`
- Resolves organization by slug from Prisma
- Calls `auth.api.listMembers({ query: { organizationSlug }, headers })` to get member list
- Determines admin status from current user's role (admin or owner)
- Conditionally renders `InviteMemberForm` for admins only
- Renders `MembersList` with all members and role-gated actions

**`src/components/workspace/invite-member-form.tsx`** — `'use client'` component:
- React Hook Form + Zod for email validation
- Calls `inviteMemberAction` with `role: 'member'` on submit
- Shows inline success message "Invitation sent to {email}"
- Shows inline server error on failure
- Resets form on success

**`src/components/workspace/members-list.tsx`** — `'use client'` component:
- `useOptimistic` for immediate role badge and member row updates
- Role change via DropdownMenu: calls `updateMemberRoleAction`, toasts success/error
- Remove member via AlertDialog confirmation: calls `removeMemberAction`, toasts success/error
- Admin actions hidden for self (current user)
- Role badges: Admin/Owner → `variant="default"`, Member → `variant="secondary"`
- `aria-label` on badges and dropdown triggers for accessibility

**`src/components/workspace/sidebar.tsx`** — Modified:
- Added `Settings` import from lucide-react and `Link` from next/link
- Uses `useWorkspace()` to get `orgSlug` for the settings URL
- Settings link placed below New Page button in sidebar bottom actions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed user.image type mismatch with Better Auth response**
- **Found during:** Task 1 TypeScript compile
- **Issue:** `MembersList` interface had `user.image: string | null` but `auth.api.listMembers` returns `user.image?: string | undefined`
- **Fix:** Changed interface to `user.image?: string | null` (optional union)
- **Files modified:** src/components/workspace/members-list.tsx
- **Commit:** 5bdbe03 (inline fix before commit)

## Verification

- TypeScript compiles without errors (pre-existing `@/generated/prisma` unresolved module is out of scope)
- 11 test suites pass, 123 tests pass
- 1 pre-existing test suite failure (prisma-search-repository.test.ts missing generated client — not caused by this plan)

## Known Stubs

None — all data flows from `auth.api.listMembers` through props to the client components. No placeholder or hardcoded data.

## Self-Check: PASSED

- [x] `src/app/[org]/settings/members/page.tsx` — created and committed
- [x] `src/components/workspace/members-list.tsx` — created and committed
- [x] `src/components/workspace/invite-member-form.tsx` — created and committed
- [x] `src/components/workspace/sidebar.tsx` — modified and committed
- [x] Commits 5bdbe03 and 674a859 exist in git log
