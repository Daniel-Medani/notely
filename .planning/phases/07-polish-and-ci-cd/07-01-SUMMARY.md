---
phase: 07-polish-and-ci-cd
plan: 01
subsystem: ui
tags: [next-themes, dark-mode, react, tailwind, testing-library, vitest]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: ThemeProvider already wired in layout.tsx with defaultTheme="system" enableSystem
provides:
  - ThemeToggle client component in sidebar bottom actions
  - Dark mode toggle accessible to user between Trash link and UserMenu
  - 4 unit tests covering ThemeToggle render and toggle behavior
affects: [07-polish-and-ci-cd]

# Tech tracking
tech-stack:
  added:
    - "@testing-library/react — component testing in jsdom environment"
    - "@testing-library/jest-dom — DOM matchers for Vitest"
    - "jsdom — browser-like environment for component tests"
  patterns:
    - "ThemeToggle uses mounted guard pattern (useState + useEffect) to prevent SSR hydration mismatch"
    - "resolvedTheme (not theme) used to resolve system preference to actual light/dark value"
    - "@vitest-environment jsdom inline directive for per-file environment override"

key-files:
  created:
    - src/components/workspace/theme-toggle.tsx
    - src/components/workspace/theme-toggle.test.tsx
  modified:
    - src/components/workspace/sidebar.tsx
    - package.json

key-decisions:
  - "Use @vitest-environment jsdom inline directive rather than changing global vitest config — preserves node environment for server-side tests"
  - "Install @testing-library/react + jsdom since no component testing infrastructure existed — required for TDD plan requirement (Rule 3 deviation)"
  - "Use resolvedTheme from useTheme() to correctly handle system theme resolution"

patterns-established:
  - "Pattern: Component unit tests use @vitest-environment jsdom directive inline for React component DOM testing"
  - "Pattern: ThemeToggle mounted guard — return disabled placeholder until mounted to prevent hydration flash"

requirements-completed: [THEME-01, THEME-02]

# Metrics
duration: 3min
completed: 2026-03-26
---

# Phase 07 Plan 01: Dark Mode Toggle Summary

**Sun/Moon ThemeToggle client component added to sidebar bottom actions using next-themes resolvedTheme with mounted hydration guard — THEME-01 and THEME-02 satisfied**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-26T23:25:00Z
- **Completed:** 2026-03-26T23:27:16Z
- **Tasks:** 2 (plus TDD RED commit)
- **Files modified:** 4

## Accomplishments
- ThemeToggle component using `useTheme().resolvedTheme` from next-themes toggles between light/dark
- Mounted guard prevents SSR hydration mismatch (disabled placeholder shown until client hydration)
- 4 unit tests pass: render with aria-label, click calls setTheme, dark→light, light→dark
- ThemeToggle placed in sidebar between Trash link and UserMenu
- THEME-02 verified: layout.tsx already has `defaultTheme="system"` and `enableSystem`

## Task Commits

Each task was committed atomically:

1. **TDD RED: Failing tests for ThemeToggle** - `dd6105f` (test)
2. **Task 1: ThemeToggle component** - `731fb55` (feat)
3. **Task 2: Mount ThemeToggle in sidebar** - `4a49e61` (feat)

**Plan metadata:** (docs commit below)

_Note: TDD tasks have multiple commits (test → feat)_

## Files Created/Modified
- `src/components/workspace/theme-toggle.tsx` - ThemeToggle client component with mounted guard and resolvedTheme
- `src/components/workspace/theme-toggle.test.tsx` - 4 unit tests covering render and click behavior
- `src/components/workspace/sidebar.tsx` - Added ThemeToggle import and mounted it in bottom actions
- `package.json` - Added @testing-library/react, @testing-library/jest-dom, jsdom devDependencies

## Decisions Made
- Used `@vitest-environment jsdom` inline directive to avoid changing global Vitest config to jsdom (which would break server-side integration tests)
- Installed @testing-library/react and jsdom since no component testing infrastructure existed — this was a blocking dependency for the TDD task requirement
- Used `resolvedTheme` from useTheme() rather than `theme` because `resolvedTheme` correctly resolves "system" to the actual theme value

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing @testing-library/react and jsdom**
- **Found during:** Task 1 (ThemeToggle TDD test writing)
- **Issue:** Plan specified `@testing-library/react` render/screen/fireEvent but neither the package nor jsdom test environment were installed
- **Fix:** `npm install --save-dev @testing-library/react @testing-library/jest-dom jsdom`; used `@vitest-environment jsdom` directive in test file to override per-file environment
- **Files modified:** package.json, package-lock.json
- **Verification:** Tests run in jsdom, all 4 pass
- **Committed in:** `dd6105f` (TDD RED commit)

---

**Total deviations:** 1 auto-fixed (1 blocking dependency)
**Impact on plan:** Required for TDD test infrastructure. No scope creep.

## Issues Encountered
- `prisma-search-repository.test.ts` fails due to missing generated Prisma client (`@/generated/prisma`) — pre-existing issue in this worktree, not related to this plan's changes. All 13 other test files pass (152 tests total). This is out of scope for this plan.
- `npx tsc --noEmit` shows 2 errors for `@/generated/prisma` — same pre-existing issue; all code added in this plan type-checks cleanly (verified by filtering the error output).

## User Setup Required
None — ThemeToggle uses next-themes which is already installed and configured. No new environment variables required.

## Next Phase Readiness
- Dark mode toggle is complete and visible in sidebar
- Phase 07 Plan 02 (rate limiting) is independent and can proceed
- No blockers for subsequent plans

---
*Phase: 07-polish-and-ci-cd*
*Completed: 2026-03-26*

## Self-Check: PASSED
- FOUND: src/components/workspace/theme-toggle.tsx
- FOUND: src/components/workspace/theme-toggle.test.tsx
- FOUND: .planning/phases/07-polish-and-ci-cd/07-01-SUMMARY.md
- FOUND commit: dd6105f (TDD RED)
- FOUND commit: 731fb55 (ThemeToggle implementation)
- FOUND commit: 4a49e61 (sidebar mount)
