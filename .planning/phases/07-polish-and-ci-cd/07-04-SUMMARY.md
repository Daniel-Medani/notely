---
phase: 07-polish-and-ci-cd
plan: 04
subsystem: testing, infra
tags: [playwright, e2e, github-actions, ci-cd]

requires:
  - phase: 01-foundation
    provides: auth flows (login, register)
  - phase: 02-block-editor
    provides: TipTap editor, page CRUD
  - phase: 04-search
    provides: search palette (Cmd+K)
  - phase: 06-trash
    provides: trash list, restore flow
provides:
  - Playwright E2E test suite covering auth, pages, editor, search, trash
  - GitHub Actions e2e job with Playwright
  - Root page redirect (authenticated → workspace, unauthenticated → login)
affects: [ci-cd, deployment]

tech-stack:
  added: [playwright, jsdom, @testing-library/react, @testing-library/jest-dom]
  patterns: [setup project auth pattern, storageState reuse, sequential workers for shared DB]

key-files:
  created:
    - e2e/auth.setup.ts
    - e2e/auth.spec.ts
    - e2e/pages.spec.ts
    - e2e/editor.spec.ts
    - e2e/search.spec.ts
    - e2e/trash.spec.ts
  modified:
    - playwright.config.ts
    - .github/workflows/ci.yml
    - src/app/page.tsx

key-decisions:
  - "Setup project pattern over globalSetup — webServer must be running before auth setup"
  - "Sequential workers (workers: 1) — tests share a database, parallel execution causes race conditions"
  - "Scope selectors to roles (complementary, tree, menuitem) — avoids strict mode violations from duplicate elements"
  - "Root page redirect instead of static placeholder — authenticated users reach workspace immediately"

patterns-established:
  - "E2E auth: setup project saves storageState, chromium project depends on setup"
  - "E2E selectors: use getByRole scoping (complementary, main, tree) over global getByText"
  - "E2E test isolation: rename to unique timestamp-based titles before interacting"

requirements-completed: [CICD-03, CICD-04, CICD-05]

duration: 45min
completed: 2026-03-26
---

# Phase 07 Plan 04: Playwright E2E Suite + CI Integration

**15 E2E tests covering auth, page CRUD, editor save, search, trash, and root redirect — plus GitHub Actions e2e job**

## Performance

- **Duration:** ~45 min (including iterative fixes with user)
- **Started:** 2026-03-26T23:30:00Z
- **Completed:** 2026-03-26T00:15:00Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- 15 Playwright E2E tests across 5 spec files, all passing
- Auth setup project pattern with storageState reuse
- GitHub Actions CI now has 3 jobs: lint-typecheck, test (unit), e2e
- Root page redirects authenticated users to workspace, unauthenticated to login

## Task Commits

1. **Task 1: Create Playwright E2E specs** - `5b428e9` (feat)
2. **Task 2: Add e2e job to CI workflow** - `f76fb0f` (feat)
3. **Task 3: Verify and fix E2E tests** - `894db5d`, `4b5eb7f` (fix, feat)

## Files Created/Modified
- `e2e/auth.setup.ts` — Setup project: authenticates test user, saves storageState
- `e2e/auth.spec.ts` — 5 tests: unauth redirect (/ and /dashboard), auth workspace landing, sign-in flow
- `e2e/pages.spec.ts` — 3 tests: create, rename, delete page
- `e2e/editor.spec.ts` — 2 tests: content persistence after debounce save, saving indicator
- `e2e/search.spec.ts` — 2 tests: Cmd+K opens search, search returns matching pages
- `e2e/trash.spec.ts` — 2 tests: deleted page in trash, restore from trash
- `playwright.config.ts` — Setup project + chromium dependency, sequential workers
- `.github/workflows/ci.yml` — 3 jobs: lint-typecheck, unit tests (--pool=forks), e2e
- `src/app/page.tsx` — Root redirect based on auth state

## Decisions Made
- Used setup project instead of globalSetup (webServer must run before auth)
- Sequential workers to avoid race conditions on shared database
- Scoped selectors to ARIA roles to handle duplicate elements cleanly
- Added root page redirect as part of E2E verification (caught UX gap)

## Deviations from Plan

### Auto-fixed Issues

**1. [Blocking] globalSetup runs before webServer — empty storageState**
- **Found during:** Task 3 (verification)
- **Issue:** Playwright globalSetup executes before webServer starts, auth setup fails silently
- **Fix:** Replaced with setup project pattern that runs after webServer
- **Files modified:** playwright.config.ts, e2e/auth.setup.ts (new), e2e/global-setup.ts (deleted)

**2. [Blocking] Tests navigate to / which is a static page**
- **Found during:** Task 3 (verification)
- **Issue:** All specs used page.goto('/') but root page showed static "Notely" text
- **Fix:** Changed to page.goto('/dashboard') and added root redirect

**3. [Blocking] Parallel workers cause flaky tests from shared DB state**
- **Found during:** Task 3 (verification)
- **Issue:** 4 parallel workers create/delete pages concurrently, causing race conditions
- **Fix:** Set workers: 1, fullyParallel: false

---

**Total deviations:** 3 auto-fixed (all blocking)
**Impact on plan:** All fixes necessary for tests to pass reliably. Root redirect was a UX improvement caught during verification.

## Issues Encountered
- Strict mode violations from duplicate "New Page" buttons and "Rename" text — resolved by scoping to ARIA roles
- Test data accumulation (multiple "Untitled" pages) — resolved by renaming to unique timestamp titles

## User Setup Required

**GitHub branch protection update required:**
- Go to GitHub Repo → Settings → Branches → Branch protection rules
- For both `development` and `main`: add `E2E Tests` to required status checks

## Next Phase Readiness
- All 4 plans in Phase 07 complete
- CI pipeline has all 3 required checks: lint-typecheck, unit tests, e2e
- Ready for phase verification

---
*Phase: 07-polish-and-ci-cd*
*Completed: 2026-03-26*
