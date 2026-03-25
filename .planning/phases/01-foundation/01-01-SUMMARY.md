---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [next.js, prisma, better-auth, shadcn, tailwind, vitest, playwright, github-actions, postgresql]

requires: []
provides:
  - Next.js 16.2.1 project with TypeScript and Tailwind v4
  - Prisma 7.5.0 schema with all Better Auth + organization tables (User, Session, Account, Verification, Organization, Member, Invitation)
  - shadcn/ui components: button, card, input, label, form, separator, skeleton
  - CI workflow gating lint + typecheck on PRs to development and main
  - Vitest 4.1.1 and Playwright 1.58.2 test framework configs
  - .env.example with all required environment variable slots
  - Docker Compose for local PostgreSQL (postgres:16-alpine)
affects: [02-auth, 03-editor, 04-pages, 05-search, 06-orgs, 07-ui-polish]

tech-stack:
  added:
    - next@16.2.1
    - better-auth@1.5.6
    - prisma@7.5.0 + @prisma/client + @prisma/adapter-neon + @neondatabase/serverless
    - zod@4.3.6
    - react-hook-form@7.72.0 + @hookform/resolvers@5.2.2
    - @tanstack/react-query@5.95.2
    - lucide-react@1.6.0
    - sonner@2.0.7
    - next-themes@0.4.6
    - server-only@0.0.1
    - tailwindcss@4.x + shadcn/ui (new-york style, OKLCH theme variables)
    - class-variance-authority + clsx + tailwind-merge (shadcn deps)
    - vitest@4.1.1
    - @playwright/test@1.58.2
    - eslint-config-prettier
  patterns:
    - Tailwind v4 @import syntax in globals.css (no tailwind.config.js)
    - OKLCH-based CSS custom properties for shadcn/ui theme (not HSL)
    - Prisma 7 schema has no url/directUrl in datasource block — moved to prisma.config.ts
    - prisma.config.ts uses defineConfig with datasource.url for migrations
    - Prisma client generated to src/generated/prisma/ (gitignored)
    - vitest.config.ts with @/* alias for import path resolution
    - eslint-config-prettier appended last in flat config to disable conflicting rules

key-files:
  created:
    - package.json (all Phase 1 dependencies)
    - prisma/schema.prisma (all Better Auth + org tables)
    - prisma.config.ts (Prisma 7 config with datasource)
    - src/app/globals.css (Tailwind v4 + shadcn OKLCH theme)
    - src/app/layout.tsx (Inter font, suppressHydrationWarning)
    - src/lib/utils.ts (cn() helper using clsx + tailwind-merge)
    - src/components/ui/{button,card,input,label,form,separator,skeleton}.tsx
    - .github/workflows/ci.yml (lint-typecheck + unit test jobs)
    - vitest.config.ts
    - playwright.config.ts
    - docker-compose.yml
    - .env.example
    - .gitignore
    - .prettierrc
    - components.json (shadcn config)
  modified: []

key-decisions:
  - "Prisma 7.5.0 schema.prisma has no url/directUrl in datasource — removed per Prisma 7 API requirement; url moved to prisma.config.ts datasource.url"
  - "prisma.config.ts migrate.adapter not in Prisma 7 PrismaConfig type — adapter is passed to PrismaClient constructor at runtime via @prisma/adapter-neon"
  - "shadcn/ui initialized with components.json manually (CLI interactive mode cannot be automated) then components added with --yes flag"
  - "Inter replaces Geist as primary font per plan requirement (Geist removed from layout, Inter added)"
  - "class-variance-authority, clsx, tailwind-merge added as runtime deps (shadcn peer deps not auto-installed by shadcn CLI)"

patterns-established:
  - "Pattern: shadcn components live in src/components/ui/ and import from @/lib/utils"
  - "Pattern: All secrets use server-only env vars, NEXT_PUBLIC_ only for non-secret public values (NEXT_PUBLIC_APP_URL)"
  - "Pattern: .env.local is gitignored, .env.example is committed as template"
  - "Pattern: src/generated/ is gitignored (Prisma client regenerated in CI via npx prisma generate)"

requirements-completed: [TNNT-01, SEC-02, SEC-04, CICD-01, CICD-02]

duration: 9min
completed: 2026-03-25
---

# Phase 01 Plan 01: Project Scaffold + Dependencies Summary

**Next.js 16.2.1 project scaffolded with Prisma 7.5.0 schema (7 Better Auth + org tables), shadcn/ui components, Vitest + Playwright configs, and GitHub Actions CI gating lint/typecheck on PRs**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-25T03:42:57Z
- **Completed:** 2026-03-25T03:51:23Z
- **Tasks:** 3 completed
- **Files modified:** 27 files created

## Accomplishments

- Next.js 16.2.1 project with all Phase 1 runtime and dev dependencies installed (better-auth, prisma, zod, react-hook-form, tanstack-query, shadcn/ui, lucide-react, sonner, next-themes, vitest, playwright)
- Prisma schema with all 7 Better Auth + organization tables (User, Session, Account, Verification, Organization, Member, Invitation) with correct relations and organizationId FK on Member and Invitation for TNNT-01
- shadcn/ui initialized (new-york style, OKLCH theme) with button, card, input, label, form, separator, skeleton components
- GitHub Actions CI workflow with lint-typecheck (ESLint + tsc + prettier) and test jobs triggered on PRs to development and main (CICD-01, CICD-02)
- Vitest 4.1.1 and Playwright 1.58.2 configured with path aliases and correct test directories

## Task Commits

1. **Task 1: Create Next.js project and install all Phase 1 dependencies** - `63b747a` (feat)
2. **Task 2: Create Prisma schema with Better Auth + organization tables** - `16ecd18` (feat)
3. **Task 3: Create CI workflow and test framework configs** - `1e9ba4b` (feat)

Additional fix commits:
- `6d420fd` (fix): Correct prisma.config.ts to use Prisma 7.5.0 API
- `3bb3c4c` (chore): Add favicon

## Files Created/Modified

- `package.json` - All Phase 1 dependencies + db/test scripts
- `prisma/schema.prisma` - 7 Better Auth + org models
- `prisma.config.ts` - Prisma 7 config (schema path + datasource url)
- `src/app/globals.css` - Tailwind v4 + OKLCH shadcn theme
- `src/app/layout.tsx` - Inter font, suppressHydrationWarning
- `src/lib/utils.ts` - cn() helper for shadcn
- `src/components/ui/*.tsx` - button, card, input, label, form, separator, skeleton
- `.github/workflows/ci.yml` - CI with lint-typecheck + test jobs
- `vitest.config.ts` - Vitest with @/* alias
- `playwright.config.ts` - Playwright with chromium + localhost:3000
- `docker-compose.yml` - postgres:16-alpine for local dev
- `.env.example` - All required env var slots (no secrets)
- `.gitignore` - node_modules, .env.local, src/generated/ excluded
- `.prettierrc` - Project code style (single quotes, no semi)
- `components.json` - shadcn config (new-york, neutral, OKLCH)

## Decisions Made

- Used `prisma.config.ts` with `datasource.url` (not `schema.prisma` datasource block) per Prisma 7.5.0 API — datasource config was moved from schema to config file in v7
- `prisma.config.ts` migrate.adapter is not part of the config API — adapter is passed to `PrismaClient` at runtime via `new PrismaNeon(sql)`, not at config time
- shadcn CLI interactive init automated by creating `components.json` manually then using `npx shadcn@latest add --yes` for components
- Inter font replaces Geist as primary `--font-sans` variable (per plan requirement)
- Added `class-variance-authority`, `clsx`, `tailwind-merge` as explicit deps (shadcn peer deps not auto-installed)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] shadcn CLI init is interactive — cannot be automated with --style flag**
- **Found during:** Task 1
- **Issue:** `npx shadcn@latest init --style new-york` throws "unknown option '--style'" in shadcn v4.1.0; the CLI is fully interactive with no non-interactive mode
- **Fix:** Manually created `components.json` with correct new-york/neutral/OKLCH settings, then used `npx shadcn@latest add --yes` for individual components
- **Files modified:** components.json
- **Verification:** All 7 shadcn components created in src/components/ui/
- **Committed in:** 63b747a (Task 1 commit)

**2. [Rule 3 - Blocking] Missing shadcn peer dependencies not auto-installed**
- **Found during:** Task 1 (TypeScript check after component install)
- **Issue:** `class-variance-authority`, `clsx`, `tailwind-merge` not installed; components import these; tsc failed
- **Fix:** `npm install class-variance-authority clsx tailwind-merge`; created `src/lib/utils.ts` with `cn()` helper
- **Files modified:** package.json, src/lib/utils.ts
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** 63b747a (Task 1 commit)

**3. [Rule 1 - Bug] Prisma 7.5.0 schema rejects url/directUrl in datasource block**
- **Found during:** Task 2 (npx prisma validate)
- **Issue:** Prisma 7 moved datasource URL config from schema.prisma to prisma.config.ts — the plan's schema template used old v6 syntax
- **Fix:** Removed url/directUrl from schema.prisma datasource block; added datasource.url to prisma.config.ts
- **Files modified:** prisma/schema.prisma, prisma.config.ts
- **Verification:** `npx prisma validate` passes; `npx prisma generate` succeeds
- **Committed in:** 16ecd18, 6d420fd

**4. [Rule 1 - Bug] prisma.config.ts had invalid earlyAccess and migrate.adapter properties**
- **Found during:** Overall verification (npm run build)
- **Issue:** PrismaConfig type does not include earlyAccess or migrate.adapter — TypeScript build failed
- **Fix:** Removed invalid properties; kept only schema path and datasource.url
- **Files modified:** prisma.config.ts
- **Verification:** `npm run build` exits 0
- **Committed in:** 6d420fd

---

**Total deviations:** 4 auto-fixed (2 blocking, 2 bugs)
**Impact on plan:** All auto-fixes required for build/correctness. No scope creep. Prisma 7 API differences from plan documentation were the primary source of issues.

## Issues Encountered

- Playwright browser install (`npx playwright install --with-deps chromium`) requires sudo and failed in this environment. CI will install browsers in the GitHub Actions runner (ubuntu-latest). Local E2E requires manual `npx playwright install chromium` by the developer after cloning.

## User Setup Required

None — no external service configuration required for this plan. Subsequent plans (auth setup, Neon DB provisioning) will require env var configuration.

## Next Phase Readiness

- Project builds cleanly with `npm run build` and `npx tsc --noEmit`
- Prisma schema ready for Phase 2 auth integration with Better Auth
- CI workflow will gate all PRs to development and main
- All Phase 1 npm dependencies installed and ready for use
- shadcn/ui components available for UI construction in subsequent plans

---
*Phase: 01-foundation*
*Completed: 2026-03-25*

## Self-Check: PASSED

All key files confirmed to exist. All task commits confirmed in git log.

- package.json: FOUND
- prisma/schema.prisma: FOUND
- prisma.config.ts: FOUND
- .github/workflows/ci.yml: FOUND
- vitest.config.ts: FOUND
- playwright.config.ts: FOUND
- src/components/ui/button.tsx: FOUND
- .env.example: FOUND
- Commit 63b747a (Task 1): FOUND
- Commit 16ecd18 (Task 2): FOUND
- Commit 1e9ba4b (Task 3): FOUND
- Commit 6d420fd (fix): FOUND
