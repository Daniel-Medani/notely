'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronRight, FileText, Plus, MoreHorizontal, Pencil, ArrowRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useWorkspace } from './workspace-layout'
import type { PageNode } from '@/lib/types/page'
import type { usePageMutations } from '@/hooks/use-page-mutations'
import { useQuery } from '@tanstack/react-query'
import { fetchPagesAction } from '@/lib/actions/page-actions'
import { PAGES_QUERY_KEY } from '@/lib/constants'
import type { PageRecord } from '@/repositories/interfaces/IPageRepository'

type MutationsType = ReturnType<typeof usePageMutations>

interface PageTreeItemProps {
  node: PageNode
  depth: number
  mutations: MutationsType
}

export function PageTreeItem({ node, depth, mutations }: PageTreeItemProps) {
  const router = useRouter()
  const params = useParams()
  const { orgSlug, organizationId } = useWorkspace()
  const [expanded, setExpanded] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState(node.title)
  const [moveOpen, setMoveOpen] = useState(false)

  const currentPageId = params?.pageId as string | undefined
  const isActive = currentPageId === node.id

  const { data: allPages = [] } = useQuery<PageRecord[]>({
    queryKey: PAGES_QUERY_KEY(organizationId),
    queryFn: () => fetchPagesAction(organizationId),
  })

  // Build set of descendant ids (to exclude from move targets)
  function getDescendantIds(pageId: string, pages: PageRecord[]): Set<string> {
    const result = new Set<string>()
    const queue = [pageId]
    while (queue.length > 0) {
      const current = queue.shift()!
      result.add(current)
      pages.filter(p => p.parentId === current).forEach(p => queue.push(p.id))
    }
    return result
  }

  const moveTargets = allPages.filter(p => {
    const descendants = getDescendantIds(node.id, allPages)
    return !descendants.has(p.id)
  })

  function handleNavigate() {
    router.push(`/${orgSlug}/${node.id}`)
  }

  function handleRenameSubmit() {
    if (renameValue.trim() && renameValue.trim() !== node.title) {
      mutations.renamePage.mutate({ id: node.id, title: renameValue.trim() })
    }
    setRenameOpen(false)
  }

  function handleDelete() {
    mutations.deletePage.mutate({ id: node.id })
  }

  function handleMove(parentId: string | null) {
    mutations.movePage.mutate({ id: node.id, parentId })
    setMoveOpen(false)
  }

  const hasChildren = node.children.length > 0

  return (
    <div>
      <div
        className={`group flex h-8 cursor-pointer items-center rounded-sm pr-1 hover:bg-sidebar-accent ${
          isActive ? 'bg-sidebar-accent font-medium' : ''
        }`}
        style={{ paddingLeft: depth * 12 + 4 }}
        onClick={handleNavigate}
      >
        {/* Chevron toggle */}
        <button
          className="mr-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm hover:bg-sidebar-accent"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {hasChildren ? (
            <ChevronRight
              className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                expanded ? 'rotate-90' : ''
              }`}
            />
          ) : (
            <span className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Emoji or icon */}
        <span className="mr-1.5 shrink-0 text-sm">
          {node.emoji ?? <FileText className="h-3.5 w-3.5 text-muted-foreground" />}
        </span>

        {/* Title */}
        <span className="flex-1 truncate text-sm">{node.title || 'Untitled'}</span>

        {/* Hover-only actions */}
        <span className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
          {/* Add child button */}
          <button
            className="flex h-5 w-5 items-center justify-center rounded-sm hover:bg-sidebar-accent"
            onClick={(e) => {
              e.stopPropagation()
              mutations.createPage.mutate({ parentId: node.id })
            }}
            aria-label="Add child page"
          >
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {/* Context menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex h-5 w-5 items-center justify-center rounded-sm hover:bg-sidebar-accent"
                onClick={(e) => e.stopPropagation()}
                aria-label="Page options"
              >
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem
                onClick={() => {
                  setRenameValue(node.title)
                  setRenameOpen(true)
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMoveOpen(true)}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Move to
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      </div>

      {/* Rename dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Rename page</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit()
              if (e.key === 'Escape') setRenameOpen(false)
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameSubmit}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move dialog */}
      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Move to</DialogTitle>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto">
            <button
              className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
              onClick={() => handleMove(null)}
            >
              Root (no parent)
            </button>
            {moveTargets.map(page => (
              <button
                key={page.id}
                className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
                onClick={() => handleMove(page.id)}
              >
                {page.emoji && <span className="mr-2">{page.emoji}</span>}
                {page.title || 'Untitled'}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Children (recursive) */}
      {expanded && hasChildren && (
        <div>
          {node.children.map(child => (
            <PageTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              mutations={mutations}
            />
          ))}
        </div>
      )}
    </div>
  )
}
