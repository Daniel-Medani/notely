'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { usePageMutations } from '@/hooks/use-page-mutations'

export default function WorkspacePage() {
  const { createPage } = usePageMutations()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === 'n' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        createPage.mutate({})
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [createPage])

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <h1 className="text-xl font-semibold">Create your first page</h1>
      <p className="text-sm text-muted-foreground">
        Use the button below or press N to add your first page.
      </p>
      <Button className="mt-2" onClick={() => createPage.mutate({})}>
        New Page
      </Button>
    </div>
  )
}
