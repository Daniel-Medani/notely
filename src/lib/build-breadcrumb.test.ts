import { describe, it, expect } from 'vitest'
import { buildBreadcrumb } from './build-breadcrumb'

const makePage = (id: string, parentId: string | null) => ({
  id,
  title: `Page ${id}`,
  emoji: null,
  parentId,
})

describe('buildBreadcrumb', () => {
  it('returns empty array for root page (parentId null)', () => {
    const pages = [makePage('root', null)]
    const result = buildBreadcrumb('root', pages)
    expect(result).toEqual([])
  })

  it('returns [parent] for a child page', () => {
    const pages = [makePage('parent', null), makePage('child', 'parent')]
    const result = buildBreadcrumb('child', pages)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('parent')
    expect(result[0].title).toBe('Page parent')
  })

  it('returns [grandparent, parent] in root-first order for a grandchild', () => {
    const pages = [
      makePage('grandparent', null),
      makePage('parent', 'grandparent'),
      makePage('grandchild', 'parent'),
    ]
    const result = buildBreadcrumb('grandchild', pages)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('grandparent')
    expect(result[1].id).toBe('parent')
  })

  it('returns empty array when page is not found in pages array', () => {
    const pages = [makePage('other', null)]
    const result = buildBreadcrumb('nonexistent', pages)
    expect(result).toEqual([])
  })

  it('does not infinite loop on circular reference (a -> b -> a)', () => {
    // Manually construct circular references (not possible with makePage helper)
    const pages = [
      { id: 'a', title: 'Page a', emoji: null, parentId: 'b' },
      { id: 'b', title: 'Page b', emoji: null, parentId: 'a' },
    ]
    // Should terminate without hanging
    const result = buildBreadcrumb('a', pages)
    expect(result.length).toBeLessThanOrEqual(50)
  })
})
