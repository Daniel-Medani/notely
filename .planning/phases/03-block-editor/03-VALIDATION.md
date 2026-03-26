---
phase: 3
slug: block-editor
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-25
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.1 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --pool=forks` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --pool=forks`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | EDIT-10 | unit | `npx vitest run src/lib/editor/sanitize-content.test.ts src/lib/schemas/page.test.ts --reporter=verbose` | TDD (created in task) | pending |
| 3-01-02 | 01 | 1 | EDIT-07, EDIT-08 | unit | `npx vitest run src/services/page-service.test.ts --reporter=verbose` | TDD (created in task) | pending |
| 3-02-01 | 02 | 1 | EDIT-05, EDIT-06 | compile | `node -e "require.resolve('@tiptap/react')" && npx tsc --noEmit` | N/A | pending |
| 3-02-02 | 02 | 1 | EDIT-06 | compile | `npx tsc --noEmit` | N/A | pending |
| 3-03-01 | 03 | 2 | EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-09 | compile | `npx tsc --noEmit` | N/A | pending |
| 3-03-02 | 03 | 2 | EDIT-01 | compile | `npx tsc --noEmit` | N/A | pending |
| 3-03-03 | 03 | 2 | all | manual | visual checkpoint | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Plan 01 is type `tdd` — test files are created as part of the RED phase within each task. No separate Wave 0 scaffolding needed.

- `src/lib/editor/sanitize-content.test.ts` — created in Plan 01 Task 1 (RED phase)
- `src/lib/schemas/page.test.ts` — already exists, extended in Plan 01 Task 1
- `src/services/page-service.test.ts` — already exists, extended in Plan 01 Task 2

*Existing vitest infrastructure covers all phase requirements — no framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Slash command `/` menu opens and inserts blocks | EDIT-02 | TipTap UI interaction — no headless test API | Open a page, type `/`, verify dropdown appears; select "Heading 2", verify H2 inserted |
| Drag-and-drop block reordering | EDIT-03 | Requires browser drag events | Open a page with 3+ blocks, drag second block above first, verify order changes |
| Keyboard shortcuts (Cmd+B, Cmd+I, Cmd+U) | EDIT-04 | Browser keyboard events | Select text, press Cmd+B, verify bold applied in TipTap output |
| Debounce auto-save (no data loss on tab close) | EDIT-05 | Requires real browser + network | Type content, close tab immediately, reopen page, verify content persisted |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or TDD-created test files
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covered by TDD plans (test files created in RED phase)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
