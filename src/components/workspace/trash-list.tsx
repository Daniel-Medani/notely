'use client'

import { useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { Trash2, RotateCcw, File } from 'lucide-react'
import { toast } from 'sonner'
import {
  restorePageAction,
  permanentlyDeletePageAction,
  emptyTrashAction,
} from '@/lib/actions/page-actions'
import type { PageRecord } from '@/repositories/interfaces/IPageRepository'

interface TrashListProps {
  pages: PageRecord[]
  organizationId: string
  orgSlug: string
}

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Deleted today'
  if (diffDays === 1) return 'Deleted 1 day ago'
  return `Deleted ${diffDays} days ago`
}

export function TrashList({ pages, organizationId }: TrashListProps) {
  const [isPending, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<PageRecord | null>(null)

  function handleRestore(pageId: string) {
    startTransition(async () => {
      const result = await restorePageAction({ id: pageId, organizationId })
      if (result.success) {
        toast.success('Page restored.')
      } else {
        toast.error('Failed to restore page. Try again.')
      }
    })
  }

  function handlePermanentDelete(pageId: string) {
    startTransition(async () => {
      const result = await permanentlyDeletePageAction({ id: pageId, organizationId })
      if (result.success) {
        toast.success('Page permanently deleted.')
        setDeleteTarget(null)
      } else {
        toast.error('Failed to delete page. Try again.')
      }
    })
  }

  function handleEmptyTrash() {
    startTransition(async () => {
      const result = await emptyTrashAction({ organizationId })
      if (result.success) {
        toast.success('Trash emptied.')
      } else {
        toast.error('Failed to empty trash. Try again.')
      }
    })
  }

  if (pages.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center gap-4">
        <Trash2 className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm font-semibold">Trash is empty</p>
        <p className="text-sm text-muted-foreground">
          Pages you delete will appear here for recovery.
        </p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <ul className="space-y-1">
        {pages.map((page) => (
          <li
            key={page.id}
            className="min-h-[44px] flex items-center justify-between gap-4 px-4 rounded-md hover:bg-muted"
          >
            {/* Left side: icon + title + date */}
            <div className="flex items-center gap-2 min-w-0">
              {page.emoji ? (
                <span className="text-base leading-none flex-shrink-0">{page.emoji}</span>
              ) : (
                <File className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{page.title}</p>
                <p className="text-xs text-muted-foreground">
                  {getRelativeTime(new Date(page.updatedAt))}
                </p>
              </div>
            </div>

            {/* Right side: restore + delete buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={`Restore ${page.title}`}
                    onClick={() => handleRestore(page.id)}
                    disabled={isPending}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Restore</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    aria-label={`Delete permanently: ${page.title}`}
                    onClick={() => setDeleteTarget(page)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete permanently</TooltipContent>
              </Tooltip>
            </div>
          </li>
        ))}
      </ul>

      {/* Permanent delete confirmation dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will permanently delete "${deleteTarget.title}" and all its content. This cannot be undone.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost">Keep in trash</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteTarget && handlePermanentDelete(deleteTarget.id)}
              disabled={isPending}
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty trash button */}
      <div className="mt-6 flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={isPending}>
              Empty Trash
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Empty trash?</AlertDialogTitle>
              <AlertDialogDescription>
                All items in trash will be permanently deleted. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={handleEmptyTrash}
                disabled={isPending}
              >
                Empty Trash
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
