interface BreadcrumbPage {
  id: string
  title: string
  emoji: string | null
}

interface PageInput {
  id: string
  title: string
  emoji: string | null
  parentId: string | null
}

export function buildBreadcrumb(pageId: string, pages: PageInput[]): BreadcrumbPage[] {
  const map = new Map<string, PageInput>()
  pages.forEach((p) => map.set(p.id, p))
  const current = map.get(pageId)
  if (!current) return []
  const ancestors: BreadcrumbPage[] = []
  let parentId = current.parentId
  const visited = new Set<string>()
  let iterations = 0
  while (parentId && iterations < 50) {
    if (visited.has(parentId)) break
    visited.add(parentId)
    const parent = map.get(parentId)
    if (!parent) break
    ancestors.unshift({ id: parent.id, title: parent.title, emoji: parent.emoji })
    parentId = parent.parentId
    iterations++
  }
  return ancestors
}
