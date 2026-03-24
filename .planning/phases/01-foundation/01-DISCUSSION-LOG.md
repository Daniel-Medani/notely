# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 01-Foundation
**Areas discussed:** Auth page design, Sign-up flow, Post-auth landing, Error & feedback UX

---

## Auth Page Design

| Option | Description | Selected |
|--------|-------------|----------|
| Single page with tabs | One /login route with Sign In / Sign Up tabs | |
| Separate pages | Dedicated /login and /register with cross-links | ✓ |
| Single page, no tabs | Smart form that detects new vs existing user | |

**User's choice:** Separate pages
**Notes:** Traditional approach like GitHub/Notion

| Option | Description | Selected |
|--------|-------------|----------|
| Centered card | Centered card on clean background | ✓ |
| Split layout | Left branding panel, right form panel | |
| Full-page form | No card, form takes viewport | |

**User's choice:** Centered card

| Option | Description | Selected |
|--------|-------------|----------|
| Above the form | Google button first, then "or" divider, then email/password | ✓ |
| Below the form | Email/password first, then Google button | |

**User's choice:** Google OAuth button above the form

| Option | Description | Selected |
|--------|-------------|----------|
| App name only | "Notely" text logo only | ✓ |
| Name + tagline | "Notely" plus a short tagline | |
| Name + icon | "Notely" with a notebook icon | |

**User's choice:** App name only

---

## Sign-up Flow

| Option | Description | Selected |
|--------|-------------|----------|
| No verification for v1 | Instant access after signup | ✓ |
| Verify before access | Must click email link first | |
| Verify later (grace period) | Access immediately, verify within 24h | |

**User's choice:** No email verification for v1

| Option | Description | Selected |
|--------|-------------|----------|
| Email + password only | Minimum friction, no name field | |
| Email + password + name | Collect display name upfront | |
| Email + password + name + confirm password | Full traditional form | ✓ |

**User's choice:** Full form with email, password, name, and confirm password

| Option | Description | Selected |
|--------|-------------|----------|
| Minimum 8 characters only | Simple rule | ✓ |
| 8+ chars with complexity | Uppercase, lowercase, number, special char | |

**User's choice:** Minimum 8 characters only

| Option | Description | Selected |
|--------|-------------|----------|
| User's name + "'s Workspace" | e.g., "Daniel's Workspace" | ✓ |
| "Personal" or "My Workspace" | Generic label | |
| User chooses during signup | Extra step to name workspace | |

**User's choice:** User's name + "'s Workspace"

---

## Post-auth Landing

| Option | Description | Selected |
|--------|-------------|----------|
| Empty workspace with sidebar | Sidebar + welcome message + "New Page" CTA | ✓ |
| Auto-create first page | Create "Getting Started" page automatically | |
| Dashboard/home page | Dedicated home showing recent activity | |

**User's choice:** Empty workspace with sidebar

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, collapsible | Toggle button to hide/show sidebar | ✓ |
| Always visible | No collapse logic | |

**User's choice:** Collapsible sidebar

| Option | Description | Selected |
|--------|-------------|----------|
| Logo + empty pages section + user menu | Full sidebar shell | ✓ |
| Minimal — logo + user menu only | Pages section added in Phase 2 | |

**User's choice:** Logo + empty pages section + user menu

---

## Error & Feedback UX

| Option | Description | Selected |
|--------|-------------|----------|
| Inline below form fields | Red text below relevant field | ✓ |
| Toast notification | Sonner toast in corner | |
| Both inline + toast | Field-level inline, general as toast | |

**User's choice:** Inline below form fields

| Option | Description | Selected |
|--------|-------------|----------|
| Disabled button with spinner | Button shows spinner, becomes disabled | ✓ |
| Full-page loading overlay | Overlay covers the form | |

**User's choice:** Disabled button with spinner

| Option | Description | Selected |
|--------|-------------|----------|
| Straight to workspace | No interstitial, zero friction | ✓ |
| Brief welcome toast | Redirect + Sonner toast | |
| Welcome screen | One-time onboarding screen | |

**User's choice:** Straight to workspace

---

## Claude's Discretion

- Exact spacing, typography, and color choices
- Loading skeleton design
- Specific error message wording
- Sign-out confirmation behavior

## Deferred Ideas

None — discussion stayed within phase scope.
