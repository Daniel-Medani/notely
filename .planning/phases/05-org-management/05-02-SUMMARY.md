---
phase: 05-org-management
plan: "02"
subsystem: ui
tags: [org-switcher, popover, dialog, react-hook-form, better-auth, tanstack-query]

requires:
  - phase: 05-01
    provides: createOrgAction Server Action, orgCreateSchema, ORGS_QUERY_KEY, authClient.organization.setActive

provides:
  - OrgSwitcher component — Popover with org list, active org indicator (Check icon), create org trigger
  - CreateOrgDialog component — RHF form, createOrgAction, sonner toast on success, router.push to new org
  - Sidebar top area replaced: Notely brand label -> OrgSwitcher
  - Server-side org list prefetch via auth.api.listOrganizations in layout
  - orgs and orgName props threaded through WorkspaceLayout -> Sidebar -> OrgSwitcher

affects:
  - phase 05-03 (settings/members page — uses same WorkspaceLayout prop chain)
  - phase 05-04 (invitation accept page — completes the org lifecycle)

tech-stack:
  added: []
  patterns:
    - "Props-down org list: layout fetches org list server-side and passes it down as props to avoid client-fetch flash"
    - "Controlled popover + dialog pair: OrgSwitcher owns both popoverOpen and createDialogOpen state, closes popover before opening dialog"
    - "TanStack Query prefetch of orgs alongside pages in layout: both prefetched in a single Promise.all"

key-files:
  created:
    - src/components/workspace/org-switcher.tsx
    - src/components/workspace/create-org-dialog.tsx
  modified:
    - src/app/[org]/layout.tsx
    - src/components/workspace/workspace-layout.tsx
    - src/components/workspace/sidebar.tsx

key-decisions:
  - "Org list passed as props from layout (not fetched client-side) — avoids loading flash; layout already does server-side auth"
  - "OrgSwitcher receives orgs as a prop array rather than using TanStack Query client-side — SSR hydration makes the data available immediately"

patterns-established:
  - "OrgSwitcher: Popover + controlled state pair for related dialog"
  - "CreateOrgDialog: useForm(zodResolver) + Server Action + router.push pattern mirrors auth form pattern"

requirements-completed: [ORG-01, ORG-08]

duration: 2min
completed: "2026-03-26"
---

# Phase 05 Plan 02: Org Switcher and Create Org Dialog Summary

**OrgSwitcher Popover and CreateOrgDialog wired into sidebar, with server-side org list prefetch replacing the Notely brand label**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-26T15:20:36Z
- **Completed:** 2026-03-26T15:22:31Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Built OrgSwitcher component: Popover with org list, active org Check indicator, and "Create organization" trigger
- Built CreateOrgDialog: RHF form with zodResolver, calls createOrgAction, shows sonner toast, navigates to new org
- Replaced sidebar "Notely" brand label with OrgSwitcher; wired orgName and orgs props through WorkspaceLayout and Sidebar
- Prefetched org list server-side in layout via auth.api.listOrganizations alongside existing pages prefetch

## Task Commits

1. **Task 1: Create OrgSwitcher and CreateOrgDialog components** - `ea7714f` (feat)
2. **Task 2: Wire OrgSwitcher into sidebar and prefetch orgs in layout** - `e8da8c7` (feat)

## Files Created/Modified

- `src/components/workspace/org-switcher.tsx` - Popover with org list, active indicator, create org trigger; uses authClient.organization.setActive + router.push
- `src/components/workspace/create-org-dialog.tsx` - RHF + zodResolver(orgCreateSchema) + createOrgAction + sonner toast
- `src/app/[org]/layout.tsx` - Added auth.api.listOrganizations, ORGS_QUERY_KEY prefetch, orgName and orgs props
- `src/components/workspace/workspace-layout.tsx` - Added orgName: string and orgs: Array to WorkspaceLayoutProps, passes to Sidebar
- `src/components/workspace/sidebar.tsx` - Added orgName and orgs props, replaced brand div with OrgSwitcher

## Decisions Made

- Org list passed as props from layout rather than fetched client-side — avoids loading flash; layout already does server-side auth so the data is available cost-free
- OrgSwitcher owns both popoverOpen and createDialogOpen state, explicitly closing the popover before opening the dialog to avoid layering issues

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- OrgSwitcher and CreateOrgDialog fully functional; users can switch orgs and create new ones from the sidebar
- Ready for Phase 05-03: settings/members page (uses WorkspaceLayout, WorkspaceContext, and same prop chain)

---
*Phase: 05-org-management*
*Completed: 2026-03-26*

## Self-Check: PASSED

- org-switcher.tsx: FOUND
- create-org-dialog.tsx: FOUND
- 05-02-SUMMARY.md: FOUND
- commit ea7714f: FOUND
- commit e8da8c7: FOUND
