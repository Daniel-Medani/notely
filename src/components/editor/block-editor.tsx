'use client'

import { useEditor, EditorContent, type JSONContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { TaskList, TaskItem } from '@tiptap/extension-list'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { Image } from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extension-placeholder'
import { createLowlight, common } from 'lowlight'
import GlobalDragHandle from 'tiptap-extension-global-drag-handle'
import { useRef, useTransition, useCallback, useEffect, useState } from 'react'
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
  const [showImageInput, setShowImageInput] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
            toast.error(`Save failed [${result.code}]: ${result.error}`)
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

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // Listen for image insert requests from the slash command extension
  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom
    const handler = () => setShowImageInput(true)
    dom.addEventListener('tiptap:image-insert', handler)
    return () => dom.removeEventListener('tiptap:image-insert', handler)
  }, [editor])

  const submitImageUrl = () => {
    const url = imageInputRef.current?.value.trim()
    if (url) editor?.chain().focus().setImage({ src: url }).run()
    setShowImageInput(false)
  }

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

      {showImageInput && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowImageInput(false)}
        >
          <div
            className="bg-background border rounded-lg shadow-lg p-4 w-96 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-medium">Insert image</p>
            <input
              ref={imageInputRef}
              autoFocus
              type="url"
              placeholder="https://example.com/image.png"
              className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitImageUrl()
                if (e.key === 'Escape') setShowImageInput(false)
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                className="text-sm px-3 py-1.5 rounded-md border hover:bg-muted"
                onClick={() => setShowImageInput(false)}
              >
                Cancel
              </button>
              <button
                className="text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={submitImageUrl}
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
