---
plan: 03-03
phase: 03-block-editor
status: complete
completed: 2026-03-26
commits:
  - e8c2c22
  - 40d9e72
  - 19c5028
  - 61d900f
  - 10533d0
  - d6642d8
  - 5eea5d7
  - 70b034f
  - 1ea82b7
  - dc4fff4
  - da97765
  - 10cd8ef
  - 47bfded
  - 34d6976
---

## What Was Built

Full TipTap block editor wired into every page route with all block types, autosave, slash commands, drag-and-drop, and a visual save indicator.

## Key Files

### Created
- `src/components/editor/block-editor.tsx` — `'use client'` component with all TipTap extensions, 800ms autosave debounce, image URL modal, and save indicator
- `src/app/[org]/[pageId]/page.tsx` — Server Component that fetches initial content via `pageService.findById` and renders `BlockEditor`

### Modified
- `src/app/globals.css` — task list checkbox styling, drag handle CSS
- `src/components/editor/slash-command.ts` — image command uses custom DOM event instead of `window.prompt`

## Decisions & Deviations

- **Image URL prompt**: `window.prompt()` is suppressed by the browser when called from inside the slash command popup (a separate `createRoot` context). Replaced with a custom modal overlay triggered via `CustomEvent('tiptap:image-insert')` dispatched on the editor DOM.
- **Task list checkbox**: Tailwind v4's `* { @apply border-border outline-ring/50 }` reset conflicts with native checkbox rendering in dark mode. Replaced native checkbox with a fully custom `appearance: none` checkbox using `var(--primary)` fill and a CSS `::after` checkmark.
- **Drag handle**: The `tiptap-extension-global-drag-handle` extension appends its handle as a sibling of `.ProseMirror` (not a child) and positions it using viewport-fixed coordinates. CSS was updated to use `position: fixed`, a `::before` dot-grid icon, and `.hide` class for visibility control.

## Verification

- All 11 block types available via slash command (paragraph, H1-H3, bullet list, numbered list, to-do, code block, blockquote, divider, image)
- Slash command filters on typing, keyboard navigation works
- To-do checkboxes toggle correctly with strikethrough on checked state
- Image inserts via URL modal (Enter to confirm, Escape to cancel)
- Autosave fires at 800ms debounce with "Saving..." indicator
- Content persists across page refresh
- Drag handle appears on hover with 2×3 dot grip icon
- Keyboard shortcuts (Cmd+B/I/U) apply formatting
- No hydration mismatch errors
- Human verified: 2026-03-26
