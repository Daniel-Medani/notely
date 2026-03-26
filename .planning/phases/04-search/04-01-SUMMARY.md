---
phase: 04-search
plan: 01
subsystem: database
tags: [postgresql, prisma, fts, full-text-search, zod, vitest, tdd]

requires:
  - phase: 01-foundation
    provides: AppError, ActionResult, handleActionError, verifySession, prisma client, Page model
  - phase: 02-page-tree
    provides: IRepository pattern, assertMembership pattern, Server Action conventions
provides:
  - SearchResult type and ISearchRepository interface
  - PrismaSearchRepository with PostgreSQL FTS via $queryRaw tagged template
  - SearchService with whitespace trimming and empty query guard
  - searchQuerySchema Zod schema (min 2 chars, max 200, org ID required)
  - searchPagesAction Server Action (verifySession + Zod + membership + service)
  - GIN index migration on Page.title + Page.content for FTS performance
  - server-only mock and dotenv loading for Vitest integration tests
affects:
  - 04-search-ui (plan 04-02 uses searchPagesAction directly)

tech-stack:
  added: []
  patterns:
    - "ISearchRepository interface decouples SearchService from Prisma implementation"
    - "$queryRaw tagged template literal with parameterized SQL prevents injection"
    - "vi.hoisted() required when mock factory references variables defined in test file"
    - "dotenv.config in vitest.config.ts loads .env for repository integration tests"
    - "server-only mock at src/__mocks__/server-only.ts unblocks Vitest from importing server modules"

key-files:
  created:
    - src/repositories/interfaces/ISearchRepository.ts
    - src/repositories/prisma/prisma-search-repository.ts
    - src/repositories/prisma/prisma-search-repository.test.ts
    - src/services/search-service.ts
    - src/services/search-service.test.ts
    - src/lib/schemas/search.ts
    - src/lib/schemas/search.test.ts
    - src/lib/actions/search-actions.ts
    - src/lib/actions/search-actions.test.ts
    - src/__mocks__/server-only.ts
    - prisma/migrations/0_init/migration.sql
    - prisma/migrations/20260326122832_add_pages_fts_index/migration.sql
  modified:
    - vitest.config.ts

key-decisions:
  - "PrismaSearchRepository uses $queryRaw<SearchResult[]> tagged template — parameterization is automatic, no $queryRawUnsafe"
  - "Repository wraps FTS query in try/catch for graceful degradation on unusual input (PostgreSQL tsquery parse failure)"
  - "Vitest needs server-only mock (src/__mocks__/server-only.ts) + dotenv.config in vitest.config.ts for repository integration tests"
  - "vi.hoisted() used in search-actions.test.ts — mock factory references mockSearch which must be available before vi.mock hoisting"
  - "Baseline migration 0_init created to bring Prisma Migrate in sync with db push history"

patterns-established:
  - "ISearchRepository: search(query, organizationId) — same two-param pattern as IRepository methods"
  - "SearchService trims query and guards against empty string before delegating to repo"
  - "Repository integration tests use afterAll cleanup with unique org IDs per test run"

requirements-completed: [SRCH-01, SRCH-02, SRCH-03]

duration: 6min
completed: 2026-03-26
---

# Phase 04 Plan 01: Search Backend Stack Summary

**PostgreSQL FTS search backend with ISearchRepository, PrismaSearchRepository ($queryRaw + plainto_tsquery), SearchService, searchQuerySchema, and searchPagesAction — 25 tests green, GIN index applied**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-26T12:23:07Z
- **Completed:** 2026-03-26T12:29:25Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Full search stack TDD'd: schema, interface, repository (integration with real PostgreSQL), service (unit with mock repo), and Server Action (unit with mocked dependencies)
- Cross-tenant isolation verified by integration test: ORG_B cannot see ORG_A pages
- Soft-delete exclusion verified by integration test: isDeleted=true pages never returned
- GIN index (`Page_fts_idx`) applied to production database for FTS performance
- Prisma Migrate baseline established (0_init) to unblock future migrations

## Task Commits

Each task was committed atomically:

1. **Task 1: TDD search schema, interface, repository, and service** - `99761dd` (feat)
2. **Task 2: TDD Server Action and GIN index migration** - `91bd0ec` (feat)

**Plan metadata:** _(pending docs commit)_

## Files Created/Modified
- `src/repositories/interfaces/ISearchRepository.ts` - SearchResult type and ISearchRepository interface
- `src/repositories/prisma/prisma-search-repository.ts` - Prisma FTS implementation using $queryRaw tagged template
- `src/repositories/prisma/prisma-search-repository.test.ts` - 8 integration tests against real PostgreSQL
- `src/services/search-service.ts` - SearchService with query trimming and empty guard
- `src/services/search-service.test.ts` - 5 unit tests with mock ISearchRepository
- `src/lib/schemas/search.ts` - searchQuerySchema (min 2 chars, max 200, org ID required)
- `src/lib/schemas/search.test.ts` - 7 schema validation tests
- `src/lib/actions/search-actions.ts` - searchPagesAction Server Action
- `src/lib/actions/search-actions.test.ts` - 5 unit tests with mocked session/prisma/service
- `src/__mocks__/server-only.ts` - No-op mock to unblock Vitest from importing server modules
- `vitest.config.ts` - Added server-only alias mock and dotenv.config for .env loading
- `prisma/migrations/0_init/migration.sql` - Baseline migration SQL for existing schema
- `prisma/migrations/20260326122832_add_pages_fts_index/migration.sql` - GIN index on Page title+content

## Decisions Made
- Used `$queryRaw` tagged template literal (not `$queryRawUnsafe`) — parameterization is automatic, SQL injection safe
- Repository wraps entire FTS query in try/catch — PostgreSQL `plainto_tsquery` can throw on unusual input; graceful degradation returns empty array
- `vi.hoisted()` used in action tests — mock factory function references a `vi.fn()` that must be initialized before vitest's `vi.mock` hoisting reorders module-level code
- Baseline migration `0_init` created — database was set up with `prisma db push` (no migration history), needed to baseline before creating the FTS index migration

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added server-only mock for Vitest test environment**
- **Found during:** Task 1 (PrismaSearchRepository integration tests)
- **Issue:** `src/repositories/prisma/prisma-search-repository.ts` imports `server-only` which throws unconditionally when imported outside Next.js server context. Vitest cannot import the module.
- **Fix:** Created `src/__mocks__/server-only.ts` (no-op) and added alias in `vitest.config.ts` so Vitest resolves `server-only` to the mock
- **Files modified:** `src/__mocks__/server-only.ts`, `vitest.config.ts`
- **Verification:** Integration tests run successfully with the mock in place
- **Committed in:** `99761dd` (Task 1 commit)

**2. [Rule 3 - Blocking] Added dotenv loading to vitest.config.ts for DATABASE_URL**
- **Found during:** Task 1 (PrismaSearchRepository integration tests)
- **Issue:** `process.env.DATABASE_URL` not set in Vitest `--pool=forks` environment; PrismaClient constructor received `undefined` connection string causing SASL auth error
- **Fix:** Added `dotenv.config()` calls in `vitest.config.ts` to load `.env` and `.env.local` before test execution
- **Files modified:** `vitest.config.ts`
- **Verification:** Repository integration tests connect to local PostgreSQL successfully
- **Committed in:** `99761dd` (Task 1 commit)

**3. [Rule 3 - Blocking] Created Prisma Migrate baseline migration to enable GIN index migration**
- **Found during:** Task 2 (GIN index migration)
- **Issue:** Database was set up with `prisma db push` with no migration history; `npx prisma migrate dev` failed with "drift detected" error
- **Fix:** Generated baseline SQL with `prisma migrate diff --from-empty --to-schema`, saved to `prisma/migrations/0_init/migration.sql`, marked as applied with `prisma migrate resolve --applied 0_init`
- **Files modified:** `prisma/migrations/0_init/migration.sql`
- **Verification:** `npx prisma migrate dev` successfully applied the GIN index migration afterward
- **Committed in:** `91bd0ec` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All auto-fixes necessary to unblock integration testing and migration creation. No scope creep.

## Issues Encountered
- The `vitest.config.ts` functional form (`defineConfig(fn)`) does not support `loadEnv` from vitest/config — it is a Vite utility not re-exported by vitest. Resolved by using `dotenv` package directly.
- `vi.mock` factory hoisting causes "Cannot access before initialization" when referencing module-level `vi.fn()` variables. Resolved by using `vi.hoisted()` to declare the mock function before module hoisting occurs.

## Known Stubs
None — all data sources are wired to the real database.

## Next Phase Readiness
- `searchPagesAction` is ready for UI consumption in plan 04-02
- `SearchResult` type exported from `ISearchRepository` for UI type safety
- GIN index applied — FTS queries will use index scans, not sequential scans
- No blockers for 04-02 (Search UI)

## Self-Check: PASSED
- All files exist: ISearchRepository, PrismaSearchRepository, SearchService, searchQuerySchema, searchPagesAction, server-only mock, migration files
- All commits exist: 99761dd (Task 1), 91bd0ec (Task 2)

---
*Phase: 04-search*
*Completed: 2026-03-26*
