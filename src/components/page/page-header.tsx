'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWorkspace } from '@/components/workspace/workspace-layout'
import { usePageMutations } from '@/hooks/use-page-mutations'
import { buildBreadcrumb } from '@/lib/build-breadcrumb'
import { fetchPagesAction } from '@/lib/actions/page-actions'
import { PAGES_QUERY_KEY } from '@/lib/constants'
import { EmojiPickerPopover } from './emoji-picker'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import type { PageRecord } from '@/repositories/interfaces/IPageRepository'

interface PageHeaderProps {
  pageId: string
}

export function PageHeader({ pageId }: PageHeaderProps) {
  const { organizationId, orgSlug } = useWorkspace()
  const { renamePage, updateEmoji } = usePageMutations()
  const { data: pages = [] } = useQuery<PageRecord[]>({
    queryKey: PAGES_QUERY_KEY(organizationId),
    queryFn: fetchPagesAction,
  })

  const currentPage = pages.find((p) => p.id === pageId)
  const breadcrumbs = buildBreadcrumb(pageId, pages)

  const [title, setTitle] = useState(currentPage?.title ?? 'Untitled')
  const titleRef = useRef<HTMLInputElement>(null)

  // Sync title from cache when it changes externally
  useEffect(() => {
    if (currentPage) {
      setTitle(currentPage.title)
    }
  }, [currentPage?.title])

  const handleTitleBlur = () => {
    const trimmed = title.trim()
    if (trimmed && trimmed !== currentPage?.title) {
      renamePage.mutate({ id: pageId, title: trimmed })
    } else if (!trimmed) {
      setTitle(currentPage?.title ?? 'Untitled')
    }
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      titleRef.current?.blur()
    }
    if (e.key === 'Escape') {
      setTitle(currentPage?.title ?? 'Untitled')
      titleRef.current?.blur()
    }
  }

  const handleEmojiSelect = (emoji: string | null) => {
    updateEmoji.mutate({ id: pageId, emoji })
  }

  if (!currentPage) {
    return (
      <div className="px-16 pt-8">
        <p className="text-sm text-muted-foreground">Page not found</p>
      </div>
    )
  }

  return (
    <div className="px-16 pt-8">
      {/* Breadcrumb */}
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, i) => (
                <BreadcrumbItem key={crumb.id}>
                  <BreadcrumbLink href={`/${orgSlug}/${crumb.id}`}>
                    {crumb.emoji && <span className="mr-1">{crumb.emoji}</span>}
                    {crumb.title}
                  </BreadcrumbLink>
                  {i < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </BreadcrumbItem>
              ))}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{currentPage.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </nav>
      )}

      {/* Emoji + Title */}
      <div className="mt-4 flex items-center gap-2">
        <EmojiPickerPopover
          emoji={currentPage.emoji}
          onEmojiSelect={handleEmojiSelect}
        />
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          className="flex-1 bg-transparent text-xl font-semibold outline-none focus:ring-1 focus:ring-ring/20 rounded px-1"
          aria-label="Page title"
          placeholder="Untitled"
        />
      </div>
    </div>
  )
}
