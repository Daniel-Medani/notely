---
phase: 07-polish-and-ci-cd
plan: 02
subsystem: infra
tags: [upstash, ratelimit, redis, server-actions, security]

# Dependency graph
requires:
  - phase: 06-trash
    provides: page-actions.ts and org-actions.ts mutation Server Actions
provides:
  - Upstash rate limiter factory with env guard (writeRatelimit, checkRateLimit)
  - Rate limiting on all 14 mutation Server Actions (9 page + 5 org)
affects: [07-03, 07-04]

# Tech tracking
tech-stack:
  added: ["@upstash/ratelimit@^2.0.8", "@upstash/redis@^1.37.0"]
  patterns: ["env guard pattern: createRatelimit returns null when UPSTASH vars absent", "checkRateLimit helper called after verifySession() before schema parse in all mutations"]

key-files:
  created:
    - src/lib/ratelimit.ts
    - src/lib/ratelimit.test.ts
  modified:
    - src/lib/actions/page-actions.ts
    - src/lib/actions/org-actions.ts
    - .env.example
    - package.json

key-decisions:
  - "Rate limit on user ID (not IP) for write mutations — authenticated, user-scoped, consistent with verifySession() already called first"
  - "checkRateLimit is a shared helper in ratelimit.ts, not inlined per-action — single source of truth for the RATE_LIMITED error shape"
  - "Auth endpoints (signIn/signUp) excluded from this plan — Better Auth handles its own rate limiting on the route handler; no Server Actions exist for auth"
  - "Env guard returns null when UPSTASH_REDIS_REST_URL is absent — rate limiting is skipped gracefully in local dev and CI without Upstash credentials"

patterns-established:
  - "Pattern 1: createRatelimit factory with env guard — returns null when vars absent, never throws on cold start"
  - "Pattern 2: checkRateLimit(session.user.id) called immediately after verifySession() in every mutation Server Action"

requirements-completed: [SEC-03]

# Metrics
duration: 15min
completed: 2026-03-26
---

# Phase 07 Plan 02: Rate Limiting Summary

**Upstash sliding-window rate limiter (30 req/60s per user) applied to all 14 mutation Server Actions via shared checkRateLimit helper with env guard**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-26T20:25:00Z
- **Completed:** 2026-03-26T20:35:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Installed @upstash/ratelimit and @upstash/redis packages
- Created `src/lib/ratelimit.ts` with env-guarded `writeRatelimit` singleton and `checkRateLimit` helper
- Applied `checkRateLimit(session.user.id)` to all 9 page mutation Server Actions and all 5 org mutation Server Actions
- 4 unit tests covering env guard, instance creation, no-op behavior, and RATE_LIMITED error throwing
- Read actions (fetchPagesAction, fetchTrashedPagesAction, getInvitationAction) correctly excluded

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ratelimit module with env guard and unit test** - `caf90bc` (feat)
2. **Task 2: Apply rate limiting to all mutation Server Actions** - `6c431a8` (feat)

## Files Created/Modified

- `src/lib/ratelimit.ts` - Upstash rate limiter factory with env guard; exports writeRatelimit and checkRateLimit
- `src/lib/ratelimit.test.ts` - 4 unit tests covering all behaviors (env guard, instance, no-op, RATE_LIMITED)
- `src/lib/actions/page-actions.ts` - checkRateLimit added to 9 mutation actions
- `src/lib/actions/org-actions.ts` - checkRateLimit added to 5 mutation actions; acceptInvitationAction now captures session
- `.env.example` - Added UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN placeholders
- `package.json` / `package-lock.json` - @upstash/ratelimit and @upstash/redis added

## Decisions Made

- Rate limit on user ID (not IP) for write mutations — authenticated user ID is the correct identifier for post-auth write abuse prevention
- Shared `checkRateLimit` helper in `ratelimit.ts` rather than per-action checks — single source of truth for RATE_LIMITED error shape and limiter reference
- Auth endpoints excluded — Better Auth's built-in rate limiting covers signIn/signUp; no Server Actions exist for auth in this project
- Env guard (`if (!process.env.UPSTASH_REDIS_REST_URL) return null`) ensures rate limiting degrades gracefully with no credentials

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- TDD mock required `function` declaration (not arrow function) for Ratelimit constructor mock — vi.fn() arrow mock cannot be used as `new` constructor. Fixed by using `function MockRatelimit() {}` syntax in vi.mock factory.
- Test 4 had module identity issue: `AppError` imported at top-level vs. dynamically imported after `vi.resetModules()` were different instances. Fixed by dynamic-importing `AppError` inside the test.

## User Setup Required

Upstash requires external service configuration:

- Create a free Redis database at https://console.upstash.com/
- Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to `.env.local` (local dev) and Vercel environment variables (production)
- Add as GitHub Secrets for CI: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Rate limiting is skipped gracefully when these vars are absent — no local dev breakage

## Next Phase Readiness

- Rate limiting complete for all mutation Server Actions (SEC-03 done)
- Plan 03 (Vitest cross-tenant tests) and Plan 04 (Playwright E2E + CI) can proceed independently
- No blockers

---
*Phase: 07-polish-and-ci-cd*
*Completed: 2026-03-26*
