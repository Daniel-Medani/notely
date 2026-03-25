---
phase: 1
slug: foundation
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-25
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.1 |
| **Config file** | `vitest.config.ts` (created in Wave 1 — Plan 01-01) |
| **Quick run command** | `npx vitest run --reporter=dot` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=dot`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 01-01-T1 | 01-01 | 1 | CICD-01, CICD-02 | build | `npx tsc --noEmit && npm run build` | ⬜ pending |
| 01-01-T2 | 01-01 | 1 | TNNT-01, SEC-02 | schema | `npx prisma generate && npx prisma validate` | ⬜ pending |
| 01-01-T3 | 01-01 | 1 | SEC-04 | config | `npx vitest run --reporter=dot \| head -5` | ⬜ pending |
| 01-02-T1 | 01-02 | 2 | AUTH-01..06, SEC-01, SEC-06 | typecheck | `npx tsc --noEmit 2>&1 \| head -20` | ⬜ pending |
| 01-02-T2 | 01-02 | 2 | SEC-05 | typecheck | `npx tsc --noEmit 2>&1 \| head -20` | ⬜ pending |
| 01-03-T1 | 01-03 | 3 | AUTH-01..04 | typecheck | `npx tsc --noEmit 2>&1 \| head -20` | ⬜ pending |
| 01-03-T2 | 01-03 | 3 | AUTH-01..04 | typecheck | `npx tsc --noEmit 2>&1 \| head -20` | ⬜ pending |
| 01-04-T1 | 01-04 | 3 | TNNT-02..04, SEC-05 | typecheck | `npx tsc --noEmit 2>&1 \| head -20` | ⬜ pending |
| 01-04-T2 | 01-04 | 3 | AUTH-06 | typecheck | `npx tsc --noEmit 2>&1 \| head -20` | ⬜ pending |
| 01-05-T1 | 01-05 | 4 | SEC-01, SEC-02, AUTH-06 | unit | `npx vitest run src/lib/schemas/auth.test.ts --reporter=dot 2>&1 \| tail -10` | ⬜ pending |
| 01-05-T2 | 01-05 | 4 | AUTH-01..04 | manual | checkpoint:human-verify | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements — vitest config and test scaffolding are created as part of Wave 1 (Plan 01-01, Task 3).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sign-in with Google OAuth | AUTH-02 | Requires live OAuth provider and browser | Click "Continue with Google", complete OAuth flow, verify landing in workspace |
| Auth UI visual checkpoint | AUTH-01..04 | Pixel-level layout and loading states | Check sign-in card centered, Google button above form, loading spinner on submit, error messages inline |
| Sidebar collapse toggle | TNNT-02 | DOM state interaction | Click collapse button, verify sidebar hides, click again to expand |
| Empty state render | TNNT-03 | Requires authenticated session | Sign in, verify "Welcome to Notely" heading and "New Page" CTA button |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or are checkpoint:human-verify
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (none — vitest installed in Wave 1)
- [x] No watch-mode flags in any automated command
- [x] Feedback latency < 15s per task
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-25
