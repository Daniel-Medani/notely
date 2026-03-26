'use client'

import { useState, useCallback } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, FileText } from 'lucide-react'
import { useWorkspace } from '@/components/workspace/workspace-layout'
import { searchPagesAction } from '@/lib/actions/search-actions'
import type { SearchResult } from '@/repositories/interfaces/ISearchRepository'

interface SearchPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function renderExcerpt(excerpt: string) {
  const parts = excerpt.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-semibold">
        {part}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    ),
  )
}

export function SearchPalette({ open, onOpenChange }: SearchPaletteProps) {
  const router = useRouter()
  const { organizationId, orgSlug } = useWorkspace()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const debouncedSearch = useDebouncedCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    const result = await searchPagesAction({ query: q, organizationId })
    if (result.success) {
      setResults(result.data)
      setError(null)
    } else {
      setError(result.error)
      setResults([])
    }
    setLoading(false)
  }, 300)

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setQuery(value)
      setHighlightedIndex(-1)
      if (value.length < 2) {
        setResults([])
        setLoading(false)
        debouncedSearch.cancel()
      } else {
        setLoading(true)
        debouncedSearch(value)
      }
    },
    [debouncedSearch],
  )

  const navigateToResult = useCallback(
    (result: SearchResult) => {
      router.push(`/${orgSlug}/${result.id}`)
      onOpenChange(false)
    },
    [router, orgSlug, onOpenChange],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (results.length === 0) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev + 1) % results.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev - 1 + results.length) % results.length)
      } else if (e.key === 'Enter') {
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          navigateToResult(results[highlightedIndex])
        }
      }
    },
    [results, highlightedIndex, navigateToResult],
  )

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setQuery('')
        setResults([])
        setError(null)
        setHighlightedIndex(-1)
        setLoading(false)
        debouncedSearch.cancel()
      }
      onOpenChange(nextOpen)
    },
    [onOpenChange, debouncedSearch],
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} aria-label="Search pages">
      <DialogContent
        className="p-0 max-w-xl gap-0 top-[10vh] translate-y-0"
        showCloseButton={false}
        onKeyDown={handleKeyDown}
        aria-label="Search pages"
      >
        <DialogTitle className="sr-only">Search pages</DialogTitle>
        <DialogDescription className="sr-only">Search through your workspace pages</DialogDescription>
        {/* Input area */}
        <div className="flex items-center gap-2 px-4 border-b">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            className="border-0 focus-visible:ring-0 h-11 text-sm px-0 shadow-none"
            placeholder="Search pages..."
            value={query}
            onChange={handleInputChange}
            aria-label="Search pages"
            aria-autocomplete="list"
            autoFocus
          />
        </div>

        {/* Results area */}
        <div role="listbox" className="max-h-[352px] overflow-y-auto py-2">
          {loading && (
            <>
              <Skeleton className="h-11 w-full rounded-md mx-4 my-1" style={{ width: 'calc(100% - 2rem)' }} />
              <Skeleton className="h-11 w-full rounded-md mx-4 my-1" style={{ width: 'calc(100% - 2rem)' }} />
              <Skeleton className="h-11 w-full rounded-md mx-4 my-1" style={{ width: 'calc(100% - 2rem)' }} />
            </>
          )}

          {!loading && error && (
            <div className="flex items-center justify-center px-4 py-8">
              <p className="text-sm text-muted-foreground">Search unavailable. Try again in a moment.</p>
            </div>
          )}

          {!loading && !error && results.length === 0 && query.length >= 2 && (
            <div className="flex flex-col items-center justify-center px-4 py-8 gap-1">
              <p className="text-sm text-foreground">
                No results for &ldquo;{query.length > 40 ? query.slice(0, 40) + '...' : query}&rdquo;
              </p>
              <p className="text-sm text-muted-foreground">Try a different word or phrase.</p>
            </div>
          )}

          {!loading && !error && results.length > 0 &&
            results.map((result, index) => (
              <div
                key={result.id}
                role="option"
                aria-selected={index === highlightedIndex}
                className={`flex items-start gap-2 px-4 min-h-[44px] cursor-pointer hover:bg-muted py-2 ${
                  index === highlightedIndex ? 'border-l-2 border-primary bg-muted' : ''
                }`}
                onClick={() => navigateToResult(result)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="mt-0.5 shrink-0">
                  {result.emoji ? (
                    <span className="text-base leading-none">{result.emoji}</span>
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold truncate">{result.title}</span>
                  {result.excerpt && (
                    <span className="text-sm text-muted-foreground line-clamp-1">
                      {renderExcerpt(result.excerpt)}
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
