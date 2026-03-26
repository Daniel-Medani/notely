---
phase: 7
slug: polish-and-ci-cd
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x + playwright 1.58.x |
| **Config file** | `vitest.config.ts` / `playwright.config.ts` |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test -- --run && npx playwright test` |
| **Estimated runtime** | ~90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run`
- **After every plan wave:** Run `npm run test -- --run && npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 7-01-01 | P01 | 1 | THEME-01 | unit | `npx vitest run src/components/workspace/theme-toggle.test.tsx` | ❌ W0 | ⬜ pending |
| 7-01-02 | P01 | 1 | THEME-02 | grep | `grep -q 'defaultTheme="system"' src/app/layout.tsx && grep -q 'enableSystem' src/app/layout.tsx` | ✅ exists | ⬜ pending |
| 7-02-01 | P02 | 1 | SEC-03 | unit | `npx vitest run src/lib/ratelimit.test.ts` | ❌ W0 | ⬜ pending |
| 7-03-01 | P03 | 1 | CICD-03 | integration | `npx vitest run --pool=forks src/repositories/prisma/prisma-page-repository.test.ts` | ❌ W0 | ⬜ pending |
| 7-04-01 | P04 | 2 | CICD-04 | e2e | `npx playwright test` | ❌ W0 | ⬜ pending |
| 7-04-02 | P04 | 2 | CICD-05 | manual | CI pipeline run on PR | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/workspace/theme-toggle.test.tsx` — stubs for THEME-01 unit tests
- [ ] `src/lib/ratelimit.test.ts` — stubs for SEC-03 rate limit unit tests
- [ ] `src/repositories/prisma/prisma-page-repository.test.ts` — stubs for CICD-03 cross-tenant isolation
- [ ] `e2e/auth.spec.ts` — stubs for CICD-04 auth flows
- [ ] `e2e/pages.spec.ts` — stubs for CICD-04 page CRUD flows
- [ ] `e2e/editor.spec.ts` — stubs for CICD-04 editor save flow
- [ ] `e2e/search.spec.ts` — stubs for CICD-04 search flow
- [ ] `e2e/trash.spec.ts` — stubs for CICD-04 trash recovery flow
- [ ] `e2e/global-setup.ts` — shared auth storageState setup

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GitHub branch protection rules active | CICD-05 | GitHub UI configuration, not testable in CI | Navigate to repo Settings → Branches → protection rules; verify `development` and `main` require all 3 checks |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
