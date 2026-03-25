import type { PageNode } from '@/lib/types/page'

interface PageInput {
  id: string
  title: string
  emoji: string | null
  parentId: string | null
  order: number
}

export function buildPageTree(pages: PageInput[]): PageNode[] {
  const map = new Map<string, PageNode>()
  const sorted = [...pages].sort((a, b) => a.order - b.order)
  sorted.forEach((p) =>
    map.set(p.id, {
      id: p.id,
      title: p.title,
      emoji: p.emoji,
      parentId: p.parentId,
      order: p.order,
      children: [],
    }),
  )
  const roots: PageNode[] = []
  sorted.forEach((p) => {
    const node = map.get(p.id)!
    if (p.parentId && map.has(p.parentId)) {
      map.get(p.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}
