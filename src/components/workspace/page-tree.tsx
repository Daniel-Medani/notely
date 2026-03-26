'use client'

import { useQuery } from '@tanstack/react-query'
import { useWorkspace } from './workspace-layout'
import { buildPageTree } from '@/lib/build-page-tree'
import { fetchPagesAction } from '@/lib/actions/page-actions'
import { PAGES_QUERY_KEY } from '@/lib/constants'
import { PageTreeItem } from './page-tree-item'
import { usePageMutations } from '@/hooks/use-page-mutations'
import type { PageRecord } from '@/repositories/interfaces/IPageRepository'

export function PageTree() {
  const { organizationId } = useWorkspace()
  const { data: pages = [] } = useQuery<PageRecord[]>({
    queryKey: PAGES_QUERY_KEY(organizationId),
    queryFn: () => fetchPagesAction(organizationId),
  })
  const mutations = usePageMutations()
  const tree = buildPageTree(pages)

  if (tree.length === 0) {
    return <p className="mt-2 text-sm text-muted-foreground">No pages yet.</p>
  }

  return (
    <div role="tree" aria-label="Page tree">
      {tree.map(node => (
        <PageTreeItem key={node.id} node={node} depth={0} mutations={mutations} />
      ))}
    </div>
  )
}
