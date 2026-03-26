---
phase: 06-trash
plan: 03
subsystem: ui
tags: [trash, restore, permanent-delete, sidebar, server-component, client-component, shadcn, lucide, sonner, useTransition]

# Dependency graph
requires:
  - phase: 06-trash-02
    provides: restorePageAction, permanentlyDeletePageAction, emptyTrashAction, fetchTrashedPagesAction in page-actions.ts
  - phase: 06-trash-01
    provides: PageService.restorePage, permanentlyDeletePage, emptyTrash, listTrashedPages methods
provides:
  - Trash route page at /[org]/trash (Server Component, membership-guarded by layout)
  - TrashList client component with restore, permanent delete, empty trash interactions
  - Sidebar Trash link in bottom actions with active state styling
affects: [phase-07-dark-mode, sidebar, workspace-layout]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Component trash page delegates auth/membership to layout guard (no redundant verifySession)
    - AlertDialog for destructive confirmation (permanent delete, empty trash) per D-11/D-12
    - useTransition + sonner toast pattern for async Server Action mutations
    - TooltipProvider wrapping list for accessible icon button tooltips
    - usePathname for active link state detection in sidebar

key-files:
  created:
    - src/app/[org]/trash/page.tsx
    - src/components/workspace/trash-list.tsx
  modified:
    - src/components/workspace/sidebar.tsx

key-decisions:
  - "TrashList receives pages as props from Server Component — no client-side fetch needed, revalidatePath handles refresh after mutations"
  - "Permanent delete dialog controlled via deleteTarget state (PageRecord | null) — open=true when target set, avoids nested AlertDialog triggers per page row"
  - "Trash link positioned after Settings in sidebar bottom actions per D-01/D-02 spec"

patterns-established:
  - "Pattern 1: Destructive action confirmation — AlertDialog with AlertDialogTrigger for stateless dialogs (empty trash), controlled open/onOpenChange for parameterized dialogs (per-page delete)"
  - "Pattern 2: Active nav link — usePathname comparison with exact route for bg-muted + font-semibold active state"

requirements-completed: [TRSH-01, TRSH-02, TRSH-03, TRSH-04]

# Metrics
duration: 12min
completed: 2026-03-26
---

# Phase 06 Plan 03: Trash UI Summary

**Trash route at /[org]/trash with restore/permanent-delete/empty-trash interactions, AlertDialog confirmations, and sidebar Trash link with active state**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-26T19:05:00Z
- **Completed:** 2026-03-26T19:17:00Z
- **Tasks:** 2 of 3 (Task 3 is human-verify checkpoint — awaiting visual verification)
- **Files modified:** 3

## Accomplishments
- Server Component trash page at /[org]/trash — fetches trashed pages server-side, delegates auth/membership to [org]/layout.tsx
- TrashList client component with flat list, restore (RotateCcw icon + toast), permanent delete (AlertDialog confirmation), empty trash (AlertDialog confirmation), and empty state
- Sidebar Trash link in bottom actions (after Settings), active state styling via usePathname

## Task Commits

Each task was committed atomically:

1. **Task 1: Create trash route page and TrashList client component** - `ac96562` (feat)
2. **Task 2: Add Trash link to sidebar bottom actions** - `5a8c6ce` (feat)
3. **Task 3: Visual verification of complete trash feature** - Awaiting human checkpoint

**Plan metadata:** (to be added after checkpoint resolution)

## Files Created/Modified
- `src/app/[org]/trash/page.tsx` - Server Component: fetches trashed pages, renders TrashList
- `src/components/workspace/trash-list.tsx` - Client Component: restore, permanent delete, empty trash with AlertDialog confirmations and empty state
- `src/components/workspace/sidebar.tsx` - Added Trash2 icon, usePathname, Trash link after Settings with active state

## Decisions Made
- TrashList controlled permanent-delete dialog uses `deleteTarget: PageRecord | null` state — avoids one AlertDialog per row, shares single dialog instance
- Empty trash uses `AlertDialogTrigger` (stateless) while per-page delete uses controlled `open/onOpenChange` pattern — appropriate per use case
- Sidebar Trash link follows exact pattern of existing Settings link (Link wrapping ghost Button)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Trash UI complete and all prior trash actions wired
- Phase 06 is the final feature phase before Phase 07 (dark mode)
- All 40 page-service and page-actions tests continue to pass

---
*Phase: 06-trash*
*Completed: 2026-03-26*
