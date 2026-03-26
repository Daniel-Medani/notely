---
phase: 06-trash
plan: 02
subsystem: api
tags: [zod, server-actions, next-cache, revalidatePath, trash, typescript]

requires:
  - phase: 06-trash-01
    provides: "pageService.restorePage, permanentlyDeletePage, emptyTrash, listTrashedPages"

provides:
  - "restorePageAction: input-validated Server Action calling pageService.restorePage + revalidating sidebar and trash"
  - "permanentlyDeletePageAction: input-validated Server Action calling pageService.permanentlyDeletePage + revalidating trash list"
  - "emptyTrashAction: input-validated Server Action calling pageService.emptyTrash + revalidating trash list"
  - "fetchTrashedPagesAction: returns PageRecord[] directly for server component consumption"
  - "pageRestoreSchema, pagePermanentDeleteSchema, pageEmptyTrashSchema Zod schemas"

affects:
  - 06-trash-03

tech-stack:
  added: []
  patterns:
    - "fetchTrashedPagesAction returns PageRecord[] directly (not ActionResult) — read-only server component data fetcher pattern"
    - "restorePageAction calls revalidatePath('/[org]', 'layout') AND revalidatePath('/[org]/trash', 'page') — dual revalidation syncs sidebar and trash list"
    - "Mutation actions return ActionResult<void>; read actions return T directly"

key-files:
  created:
    - src/lib/actions/page-actions.test.ts
  modified:
    - src/lib/schemas/page.ts
    - src/lib/actions/page-actions.ts

key-decisions:
  - "fetchTrashedPagesAction returns PageRecord[] directly (not ActionResult) because it is consumed by a Server Component, not a mutation handler"
  - "restorePageAction revalidates both /[org] layout (sidebar page tree) and /[org]/trash page — restore changes both views"
  - "permanentlyDeletePageAction and emptyTrashAction only revalidate /[org]/trash page — deleted pages don't need sidebar refresh"

patterns-established:
  - "TDD with vi.hoisted() for mock factories that reference shared mock objects inside vi.mock() factories"
  - "vi.fn(function() { return mockObj }) pattern for class constructor mocks (not arrow functions)"

requirements-completed: [TRSH-01, TRSH-02, TRSH-03, TRSH-04]

duration: 2min
completed: 2026-03-26
---

# Phase 6 Plan 2: Trash Server Actions Summary

**4 trash Server Actions (restore, permanently delete, empty trash, fetch) with Zod schemas, membership guards, revalidatePath calls, and 16-test coverage**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-26T18:59:45Z
- **Completed:** 2026-03-26T19:01:50Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 3

## Accomplishments

- Added 3 Zod schemas (pageRestoreSchema, pagePermanentDeleteSchema, pageEmptyTrashSchema) to page.ts
- Implemented 4 Server Actions with full assertMembership guards and revalidatePath calls after mutations
- Created comprehensive test file with 16 tests covering success paths, Zod validation errors, FORBIDDEN cases, and revalidatePath assertions

## Task Commits

Each task was committed atomically:

1. **RED: Failing tests + Zod schemas** - `64d108e` (test)
2. **GREEN: Server Actions implementation** - `7c04950` (feat)

**Plan metadata:** *(created as part of this summary)*

_Note: TDD tasks have two commits (test RED → feat GREEN)_

## Files Created/Modified

- `src/lib/schemas/page.ts` - Added pageRestoreSchema, pagePermanentDeleteSchema, pageEmptyTrashSchema and their TypeScript infer types
- `src/lib/actions/page-actions.ts` - Added restorePageAction, permanentlyDeletePageAction, emptyTrashAction, fetchTrashedPagesAction; added revalidatePath import
- `src/lib/actions/page-actions.test.ts` - New comprehensive test file for all trash actions plus deletePageAction cascade verification

## Decisions Made

- `fetchTrashedPagesAction` returns `PageRecord[]` directly (not `ActionResult`) — it is consumed by a Server Component rendering the trash list, not a mutation handler
- `restorePageAction` calls both `revalidatePath('/[org]', 'layout')` and `revalidatePath('/[org]/trash', 'page')` because restoring a page needs to refresh the sidebar page tree AND remove the item from the trash list
- `permanentlyDeletePageAction` and `emptyTrashAction` only revalidate the trash page — permanently deleted pages don't appear in the sidebar

## Deviations from Plan

None — plan executed exactly as written. The only debugging needed was correcting the `vi.mock` factory pattern (used `vi.hoisted()` + `vi.fn(function() {...})` instead of arrow function, following the established `search-actions.test.ts` pattern in the codebase).

## Issues Encountered

- Initial `vi.mock('@/services/page-service', () => ({ PageService: vi.fn(() => mockPageService) }))` failed because `mockPageService` was not available at hoist time and arrow functions cannot be used as constructors. Fixed by using `vi.hoisted()` and `vi.fn(function() { return mockPageService })` — matching the existing pattern in `search-actions.test.ts`.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All 4 trash Server Actions are ready for the trash UI (Plan 03) to call
- fetchTrashedPagesAction is the data fetcher for the Server Component page list
- restorePageAction and permanentlyDeletePageAction are the per-item action handlers
- emptyTrashAction is the bulk action handler for the "Empty trash" button

---
*Phase: 06-trash*
*Completed: 2026-03-26*
