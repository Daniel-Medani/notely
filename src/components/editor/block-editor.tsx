'use client'

import { useEditor, EditorContent, type JSONContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { TaskList, TaskItem } from '@tiptap/extension-list'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { Image } from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extension-placeholder'
import { createLowlight, common } from 'lowlight'
import GlobalDragHandle from 'tiptap-extension-global-drag-handle'
import { useRef, useTransition, useCallback, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useWorkspace } from '@/components/workspace/workspace-layout'
import { updatePageContentAction } from '@/lib/actions/page-actions'
import { SlashCommand, SLASH_COMMANDS } from './slash-command'
import { SlashCommandList } from './slash-command-list'
import type { SlashCommandListRef } from './slash-command-list'
import { toast } from 'sonner'

// Module-level lowlight instance — created once, shared across editor instances
const lowlight = createLowlight(common)

interface BlockEditorProps {
  pageId: string
  initialContent: JSONContent | null
}

export function BlockEditor({ pageId, initialContent }: BlockEditorProps) {
  const { organizationId } = useWorkspace()
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup debounce timer on unmount (Pitfall 5: autosave firing after unmount)
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleUpdate = useCallback(
    ({ editor }: { editor: any }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const json = editor.getJSON()
        startTransition(async () => {
          const result = await updatePageContentAction({
            id: pageId,
            organizationId,
            content: json,
          })
          if (!result.success) {
            toast.error('Failed to save. Your changes may not be preserved. Try again.')
          }
        })
      }, 800)
    },
    [pageId, organizationId],
  )

  const editor = useEditor({
    immediatelyRender: false, // CRITICAL: prevents SSR hydration mismatch in Next.js App Router
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disabled — using CodeBlockLowlight instead (Pitfall 7)
        link: {
          isAllowedUri: (url: string, ctx: any) => {
            return ctx.defaultValidate(url) && !/^javascript:/i.test(url)
          },
          openOnClick: false,
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({ allowBase64: false }),
      Placeholder.configure({
        placeholder: "Type '/' for commands...",
      }),
      GlobalDragHandle,
      SlashCommand.configure({
        suggestion: {
          items: ({ query }: { query: string }) => {
            const q = query.toLowerCase()
            return SLASH_COMMANDS.filter(
              (item) =>
                item.title.toLowerCase().startsWith(q) ||
                item.aliases.some((alias) => alias.startsWith(q)),
            )
          },
          render: () => {
            let component: SlashCommandListRef | null = null
            let popup: HTMLDivElement | null = null
            let root: Root | null = null

            return {
              onStart: (props: any) => {
                popup = document.createElement('div')
                popup.style.position = 'fixed'
                popup.style.zIndex = '9999'
                popup.style.minWidth = '220px'
                document.body.appendChild(popup)

                const rect = props.clientRect?.()
                if (rect) {
                  popup.style.left = `${rect.left}px`
                  popup.style.top = `${rect.bottom + 4}px`
                } else {
                  popup.style.left = '50px'
                  popup.style.top = '100px'
                }

                root = createRoot(popup)
                root.render(
                  <SlashCommandList
                    items={props.items}
                    command={(item: any) => props.command(item)}
                    ref={(ref: SlashCommandListRef | null) => {
                      component = ref
                    }}
                  />,
                )
              },
              onUpdate: (props: any) => {
                if (!popup || !root) return
                const rect = props.clientRect?.()
                if (rect) {
                  popup.style.left = `${rect.left}px`
                  popup.style.top = `${rect.bottom + 4}px`
                }
                root.render(
                  <SlashCommandList
                    items={props.items}
                    command={(item: any) => props.command(item)}
                    ref={(ref: SlashCommandListRef | null) => {
                      component = ref
                    }}
                  />,
                )
              },
              onKeyDown: (props: any) => {
                if (props.event.key === 'Escape') {
                  root?.unmount()
                  root = null
                  popup?.remove()
                  popup = null
                  return true
                }
                return component?.onKeyDown?.(props) ?? false
              },
              onExit: () => {
                root?.unmount()
                root = null
                popup?.remove()
                popup = null
              },
            }
          },
        },
      }),
    ],
    content: initialContent ?? undefined,
    onUpdate: handleUpdate,
  })

  return (
    <div
      className="px-16 py-8 relative min-h-[calc(100vh-120px)] cursor-text"
      onClick={() => editor?.chain().focus().run()}
    >
      {isPending && (
        <div className="absolute top-2 right-4 flex items-center gap-1.5" aria-live="polite">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-muted-foreground">Saving...</span>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  )
}
