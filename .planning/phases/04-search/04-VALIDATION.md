---
phase: 4
slug: search
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose src/` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose src/`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 1 | SRCH-01, SRCH-02, SRCH-03 | unit + integration | `npx vitest run src/lib/schemas/search.test.ts src/services/search-service.test.ts src/repositories/prisma/prisma-search-repository.test.ts --pool=forks -x` | ❌ created by task | ⬜ pending |
| 4-01-02 | 01 | 1 | SRCH-01, SRCH-02, SRCH-03 | unit | `npx vitest run src/lib/actions/search-actions.test.ts -x` | ❌ created by task | ⬜ pending |
| 4-02-01 | 02 | 2 | SRCH-01, SRCH-02 | type-check + manual | `npx tsc --noEmit` (type-check); behavioral via checkpoint Task 2 | — | ⬜ pending |
| 4-02-02 | 02 | 2 | SRCH-01, SRCH-02 | manual | checkpoint:human-verify — full interactive verification | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No Wave 0 stubs needed — Plan 01 is a TDD plan that creates tests inline as part of the RED-GREEN-REFACTOR cycle. Test files are created within each task:

- `src/lib/schemas/search.test.ts` — created in Plan 01, Task 1
- `src/services/search-service.test.ts` — created in Plan 01, Task 1
- `src/repositories/prisma/prisma-search-repository.test.ts` — created in Plan 01, Task 1
- `src/lib/actions/search-actions.test.ts` — created in Plan 01, Task 2

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cmd+K opens search dialog | SRCH-01 | Keyboard shortcut requires browser interaction | Open app, press Cmd+K, verify dialog appears |
| Clicking search control opens dialog | SRCH-01 | UI interaction requires browser | Click search icon/button, verify dialog opens |
| Results scoped to current org only | SRCH-02 | Requires multi-org test data in browser | Login as org-A user, search for content only in org-B, verify no cross-org results |
| Keyboard navigation and result selection | SRCH-01 | Interactive browser behavior | Use ArrowDown/Up to navigate, Enter to select |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
