---
phase: quick
plan: 260327-jjh
subsystem: email
tags: [email, resend, better-auth, templates, transactional]
dependency_graph:
  requires: []
  provides: [email-service-abstraction, email-templates, better-auth-email-flows]
  affects: [src/lib/auth.ts, src/lib/email/]
tech_stack:
  added: []
  patterns: [email-service-abstraction, base-layout-template-pattern]
key_files:
  created:
    - src/lib/email/send.ts
    - src/lib/email/templates/base.ts
    - src/lib/email/templates/invitation.ts
    - src/lib/email/templates/email-verification.ts
    - src/lib/email/templates/password-reset.ts
  modified:
    - src/lib/auth.ts
    - .env.example
decisions:
  - sendEmail wraps Resend SDK with RESEND_API_KEY guard so local dev without credentials degrades gracefully (log warning, skip send)
  - requireEmailVerification: true on emailAndPassword — login blocked until email verified
  - revokeSessionsOnPasswordReset: true — all existing sessions invalidated on password reset for security
  - Hardcoded from address (noreply@notely.app) in send.ts — no RESEND_FROM_EMAIL env var needed for single sender
metrics:
  duration: 8 minutes
  completed: 2026-03-27
  tasks_completed: 2
  files_changed: 7
---

# Quick 260327-jjh: Set Up Full Resend Email Layer Summary

**One-liner:** Resend email service abstraction with branded HTML templates for invitation, email verification, and password reset wired into Better Auth callbacks.

## What Was Built

Centralized all transactional email sending through `src/lib/email/send.ts` with a `sendEmail()` function that wraps the Resend SDK. Three new branded HTML templates share a common `baseLayout()` wrapper (max-width 600px, white card, Notely text logo, dark CTA button #171717, inline CSS only for email client compatibility).

Better Auth is now configured to:
- Send verification emails on signup (`emailVerification.sendOnSignUp: true`)
- Block login until email is verified (`requireEmailVerification: true`)
- Send password reset emails via the new service with 1-hour expiry and session revocation
- Use the `invitationEmail` template for organization invitations (replacing inline Resend code)

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create email service abstraction and HTML templates | 8706e7b | send.ts, base.ts, invitation.ts, email-verification.ts, password-reset.ts |
| 2 | Configure Better Auth email flows and refactor invitation email | 994d17d | auth.ts, .env.example |

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

Files confirmed present:
- src/lib/email/send.ts: FOUND
- src/lib/email/templates/base.ts: FOUND
- src/lib/email/templates/invitation.ts: FOUND
- src/lib/email/templates/email-verification.ts: FOUND
- src/lib/email/templates/password-reset.ts: FOUND

Commits confirmed:
- 8706e7b: FOUND
- 994d17d: FOUND

Verification:
- `grep -r "import('resend')" src/lib/auth.ts` returns no matches
- `grep "sendEmail" src/lib/auth.ts` shows 3 callbacks use abstraction
- `grep "RESEND_API_KEY" .env.example` confirms env var documented
- `npx tsc --noEmit` passes (only pre-existing Prisma client generation errors unrelated to this task)
