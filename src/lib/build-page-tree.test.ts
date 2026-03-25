import { describe, it, expect } from 'vitest'
import { buildPageTree } from './build-page-tree'

const makePage = (id: string, parentId: string | null, order: number) => ({
  id,
  title: `Page ${id}`,
  emoji: null,
  parentId,
  order,
})

describe('buildPageTree', () => {
  it('returns empty array for empty input', () => {
    expect(buildPageTree([])).toEqual([])
  })

  it('returns single root page with empty children', () => {
    const result = buildPageTree([makePage('a', null, 1)])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('a')
    expect(result[0].children).toEqual([])
  })

  it('returns three root pages sorted by order', () => {
    const pages = [makePage('c', null, 3), makePage('a', null, 1), makePage('b', null, 2)]
    const result = buildPageTree(pages)
    expect(result).toHaveLength(3)
    expect(result[0].id).toBe('a')
    expect(result[1].id).toBe('b')
    expect(result[2].id).toBe('c')
  })

  it('parent has two children sorted by order', () => {
    const pages = [
      makePage('parent', null, 1),
      makePage('child2', 'parent', 2),
      makePage('child1', 'parent', 1),
    ]
    const result = buildPageTree(pages)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('parent')
    expect(result[0].children).toHaveLength(2)
    expect(result[0].children[0].id).toBe('child1')
    expect(result[0].children[1].id).toBe('child2')
  })

  it('produces correct 3-level nesting (root > child > grandchild)', () => {
    const pages = [
      makePage('root', null, 1),
      makePage('child', 'root', 1),
      makePage('grandchild', 'child', 1),
    ]
    const result = buildPageTree(pages)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('root')
    expect(result[0].children[0].id).toBe('child')
    expect(result[0].children[0].children[0].id).toBe('grandchild')
  })

  it('treats orphaned pages (parentId references non-existent ID) as root nodes', () => {
    const pages = [makePage('orphan', 'nonexistent-id', 1)]
    const result = buildPageTree(pages)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('orphan')
  })

  it('does not filter isDeleted pages (filtering happens before this function)', () => {
    const pages = [
      { id: 'deleted', title: 'Deleted Page', emoji: null, parentId: null, order: 1 },
      { id: 'normal', title: 'Normal Page', emoji: null, parentId: null, order: 2 },
    ]
    const result = buildPageTree(pages)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('deleted')
    expect(result[1].id).toBe('normal')
  })
})
