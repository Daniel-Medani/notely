---
phase: 5
slug: org-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + Playwright 1.58.x |
| **Config file** | `vitest.config.ts` / `playwright.config.ts` |
| **Quick run command** | `npx vitest run --reporter=dot` |
| **Full suite command** | `npx vitest run && npx playwright test` |
| **Estimated runtime** | ~30 seconds (unit) / ~120 seconds (E2E) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=dot`
- **After every plan wave:** Run `npx vitest run && npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | ORG-01 | unit | `npx vitest run src/lib/schemas/org.test.ts` | TDD (created in task) | pending |
| 05-01-02 | 01 | 1 | ORG-01..07 | unit | `npx vitest run src/lib/actions/org-actions.test.ts` | TDD (created in task) | pending |
| 05-02-01 | 02 | 2 | ORG-01, ORG-08 | typecheck | `npx tsc --noEmit` | n/a | pending |
| 05-02-02 | 02 | 2 | ORG-01, ORG-08 | typecheck | `npx tsc --noEmit` | n/a | pending |
| 05-03-01 | 03 | 2 | ORG-02..06 | typecheck | `npx tsc --noEmit` | n/a | pending |
| 05-03-02 | 03 | 2 | ORG-02..06 | typecheck | `npx tsc --noEmit` | n/a | pending |
| 05-04-01 | 04 | 3 | ORG-03 | typecheck | `npx tsc --noEmit` | n/a | pending |
| 05-04-02 | 04 | 3 | ORG-03..08 | checkpoint | human-verify | n/a | pending |

*Status: pending / green / red / flaky*

**Note on UI plans (02, 03):** Plans 02 and 03 produce UI components verified only by `npx tsc --noEmit`. This is an accepted risk — behavioral testing of these components is deferred to the Phase 5 checkpoint (05-04-02) which exercises all UI flows manually. The backend logic they invoke is fully covered by Plan 01 unit tests.

---

## Wave 0 Requirements

Plan 01 uses TDD (`type: tdd`), so test files are created as part of the RED step within each task. No separate Wave 0 stubs are needed:

- [x] `src/lib/schemas/org.test.ts` — created in 05-01 Task 1 (TDD RED step)
- [x] `src/lib/actions/org-actions.test.ts` — created in 05-01 Task 2 (TDD RED step, includes ORG-07 access control test)

E2E tests for org flows are covered by the human verification checkpoint in 05-04-02. Automated E2E (Playwright) for org management is deferred to Phase 7 (CICD-04).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Invitation email received | ORG-02 | External email delivery cannot be automated in CI | Create org, invite email address, check inbox for invitation email |
| Resend domain configuration | ORG-02 | DNS/domain setup is external | Verify RESEND_API_KEY env var set, domain verified in Resend dashboard |
| callbackUrl redirect after login | ORG-03 | Requires browser interaction with auth flow | Open invite link unauthenticated, click "Sign in to accept", sign in, verify redirect back to invite page |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
