---
phase: 01-foundation
plan: 05
subsystem: ui
tags: [next-themes, sonner, zod, vitest, layout, dark-mode, validation]

# Dependency graph
requires:
  - phase: 01-foundation-01
    provides: "initial Next.js project scaffold with basic layout"
  - phase: 01-foundation-03
    provides: "sign-up and sign-in pages with Zod auth schemas"
  - phase: 01-foundation-04
    provides: "workspace shell with sidebar, empty state, sign-out"
provides:
  - "Root layout finalized with ThemeProvider (next-themes) and Toaster (sonner)"
  - "Zod auth schema unit tests — 8 tests covering all validation rules and error messages"
  - "suppressHydrationWarning set for SSR-safe dark mode"
  - "Inter font reconfigured with --font-sans CSS variable"
affects: [phase-07-dark-mode, any phase using toast notifications]

# Tech tracking
tech-stack:
  added:
    - "next-themes ^0.4.6 — dark mode ThemeProvider"
    - "sonner ^2.0.7 — toast notification Toaster"
  patterns:
    - "Root layout wraps children with ThemeProvider + Toaster — provider chain established for Phase 7"
    - "TDD schema tests: tests written before verifying against existing implementation"

key-files:
  created:
    - "src/lib/schemas/auth.test.ts — 8 Vitest tests for signUpSchema and signInSchema"
  modified:
    - "src/app/layout.tsx — added ThemeProvider, Toaster, suppressHydrationWarning, Inter --font-sans variable"

key-decisions:
  - "Inter font variable renamed from --font-inter to --font-sans per plan spec (shadcn/ui new-york convention)"
  - "ThemeProvider placed outside Toaster so toasts inherit theme correctly"

patterns-established:
  - "Layout provider chain: ThemeProvider wraps children, Toaster is sibling inside ThemeProvider"
  - "Schema test pattern: safeParse + issues.find() to locate per-field error messages"

requirements-completed: [SEC-01, SEC-02, AUTH-06]

# Metrics
duration: 15min
completed: 2026-03-25
---

# Phase 1 Plan 05: Root Layout Providers and Zod Schema Tests Summary

**Root layout finalized with next-themes ThemeProvider and sonner Toaster; 8 Vitest tests verify all Zod auth validation rules match UI-SPEC error messages exactly**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-25T20:50:51Z
- **Completed:** 2026-03-25T21:05:00Z
- **Tasks:** 1 completed (Task 2 is a human-verify checkpoint, pending visual verification)
- **Files modified:** 2

## Accomplishments

- Updated `src/app/layout.tsx` with `ThemeProvider` (next-themes) and `Toaster` (sonner), providing the provider chain for Phase 7 dark mode with zero future layout changes needed
- Added `suppressHydrationWarning` to `<html>` for SSR-safe theme detection
- Created `src/lib/schemas/auth.test.ts` with 8 unit tests — all pass, confirming every validation error message matches UI-SPEC exactly (SEC-01)
- Installed missing `node_modules` dependencies (worktree had no node_modules)

## Task Commits

Each task was committed atomically:

1. **Task 1: Finalize root layout with providers and add Zod schema unit tests** - `0eebe76` (feat)

**Plan metadata:** (pending — after human verification)

## Files Created/Modified

- `src/app/layout.tsx` — Added ThemeProvider, Toaster, suppressHydrationWarning; updated Inter font to use `--font-sans` CSS variable
- `src/lib/schemas/auth.test.ts` — 8 tests for signUpSchema (5 tests) and signInSchema (3 tests)

## Decisions Made

- Inter font variable renamed from `--font-inter` to `--font-sans` to align with shadcn/ui new-york convention (consistent with plan spec)
- ThemeProvider wraps children and Toaster so both inherit the theme context correctly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing npm dependencies**
- **Found during:** Task 1
- **Issue:** Worktree had no `node_modules/` — `vitest` and `tsc` were unavailable
- **Fix:** Ran `npm install` to populate the local node_modules
- **Files modified:** node_modules (not committed — in .gitignore)
- **Verification:** `./node_modules/.bin/vitest run` succeeded; 8 tests pass
- **Committed in:** n/a (node_modules not tracked in git)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** npm install is routine worktree setup. No scope creep.

## Issues Encountered

- Pre-existing TypeScript error: `src/lib/db.ts` cannot find `@/generated/prisma` (Prisma client not generated). This is out-of-scope for this plan — Prisma client generation requires a database connection and `prisma generate`. Deferred to when the database is live.

## Known Stubs

None — this plan has no UI rendering or data flow stubs.

## User Setup Required

None - no external service configuration required for this plan specifically.

**For full auth flow visual verification (Task 2 checkpoint):** You need:
1. A running PostgreSQL database (Neon or Docker) with `DATABASE_URL` in `.env.local`
2. `npx prisma db push` to sync schema
3. `BETTER_AUTH_SECRET` set in `.env.local`
4. Optional: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for OAuth

## Next Phase Readiness

- Phase 1 foundation is functionally complete pending user visual verification of the auth flow
- Root layout provider chain is ready — Phase 7 dark mode requires no layout changes
- All Zod schema validation is test-covered and matches UI-SPEC error messages
- The pre-existing `prisma generate` step must be run before TypeScript compilation is clean

---
*Phase: 01-foundation*
*Completed: 2026-03-25*
