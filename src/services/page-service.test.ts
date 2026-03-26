import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PageService } from './page-service'
import type { IPageRepository, PageRecord, CreatePageData, UpdatePageData } from '@/repositories/interfaces/IPageRepository'

// In-memory mock repository
function createMockRepo(): IPageRepository & {
  _pages: PageRecord[]
} {
  const pages: PageRecord[] = []

  const repo = {
    _pages: pages,

    findById: vi.fn(async (id: string, organizationId: string): Promise<PageRecord | null> => {
      return pages.find(p => p.id === id && p.organizationId === organizationId) ?? null
    }),

    findAll: vi.fn(async (organizationId: string): Promise<PageRecord[]> => {
      return pages.filter(p => p.organizationId === organizationId)
    }),

    findAllForOrg: vi.fn(async (organizationId: string): Promise<PageRecord[]> => {
      return pages
        .filter(p => p.organizationId === organizationId && !p.isDeleted)
        .sort((a, b) => a.order - b.order)
    }),

    create: vi.fn(async (data: CreatePageData, organizationId: string): Promise<PageRecord> => {
      const page: PageRecord = {
        id: `page-${Date.now()}-${Math.random()}`,
        organizationId,
        title: data.title ?? 'Untitled',
        emoji: data.emoji ?? null,
        content: null,
        order: data.order,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        parentId: data.parentId ?? null,
      }
      pages.push(page)
      return page
    }),

    update: vi.fn(async (id: string, data: UpdatePageData, organizationId: string): Promise<PageRecord> => {
      const index = pages.findIndex(p => p.id === id && p.organizationId === organizationId)
      if (index === -1) throw new Error(`Page ${id} not found`)
      const updated = { ...pages[index], ...data, updatedAt: new Date() }
      pages[index] = updated
      return updated
    }),

    delete: vi.fn(async (id: string, organizationId: string): Promise<void> => {
      const index = pages.findIndex(p => p.id === id && p.organizationId === organizationId)
      if (index !== -1) pages.splice(index, 1)
    }),

    findAllTrashed: vi.fn(async (organizationId: string): Promise<PageRecord[]> => {
      return pages.filter(p => p.organizationId === organizationId && p.isDeleted)
    }),

    softDeleteMany: vi.fn(async (ids: string[], organizationId: string): Promise<void> => {
      ids.forEach(id => {
        const p = pages.find(pg => pg.id === id && pg.organizationId === organizationId)
        if (p) p.isDeleted = true
      })
    }),

    restoreMany: vi.fn(async (ids: string[], organizationId: string, newParentId: string | null, rootId: string): Promise<void> => {
      ids.forEach(id => {
        const p = pages.find(pg => pg.id === id && pg.organizationId === organizationId)
        if (p) {
          p.isDeleted = false
          if (p.id === rootId) p.parentId = newParentId
        }
      })
    }),

    permanentlyDeleteMany: vi.fn(async (ids: string[], organizationId: string): Promise<void> => {
      const toRemove = ids.filter(id => pages.some(p => p.id === id && p.organizationId === organizationId))
      toRemove.forEach(id => {
        const idx = pages.findIndex(p => p.id === id)
        if (idx !== -1) pages.splice(idx, 1)
      })
    }),

    emptyTrash: vi.fn(async (organizationId: string): Promise<void> => {
      for (let i = pages.length - 1; i >= 0; i--) {
        if (pages[i].organizationId === organizationId && pages[i].isDeleted) pages.splice(i, 1)
      }
    }),
  }

  return repo
}

const ORG_ID = 'org-test-123'

describe('PageService', () => {
  let repo: ReturnType<typeof createMockRepo>
  let service: PageService

  beforeEach(() => {
    repo = createMockRepo()
    service = new PageService(repo)
  })

  describe('createPage', () => {
    it('sets order to 1.0 when no siblings exist', async () => {
      const page = await service.createPage(null, ORG_ID)
      expect(page.order).toBe(1.0)
      expect(page.title).toBe('Untitled')
    })

    it('sets order = max sibling order + 1.0 when siblings exist', async () => {
      // Create two existing siblings at the root level
      repo._pages.push(
        {
          id: 'existing-1',
          organizationId: ORG_ID,
          title: 'Existing 1',
          emoji: null,
          content: null,
          order: 1.0,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          parentId: null,
        },
        {
          id: 'existing-2',
          organizationId: ORG_ID,
          title: 'Existing 2',
          emoji: null,
          content: null,
          order: 2.5,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          parentId: null,
        }
      )

      const page = await service.createPage(null, ORG_ID)
      expect(page.order).toBe(3.5)
    })
  })

  describe('renamePage', () => {
    it('updates the title and returns the updated page', async () => {
      repo._pages.push({
        id: 'page-1',
        organizationId: ORG_ID,
        title: 'Old Title',
        emoji: null,
        content: null,
        order: 1.0,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        parentId: null,
      })

      const result = await service.renamePage('page-1', 'New Title', ORG_ID)
      expect(result.title).toBe('New Title')
      expect(repo.update).toHaveBeenCalledWith('page-1', { title: 'New Title' }, ORG_ID)
    })

    it('throws PAGE_NOT_FOUND when page does not exist', async () => {
      await expect(service.renamePage('nonexistent', 'Title', ORG_ID)).rejects.toMatchObject({
        code: 'PAGE_NOT_FOUND',
      })
    })
  })

  describe('deletePage', () => {
    it('cascade soft-deletes a leaf page by calling softDeleteMany with its own id', async () => {
      repo._pages.push({
        id: 'leaf-1',
        organizationId: ORG_ID,
        title: 'Leaf Page',
        emoji: null,
        content: null,
        order: 1.0,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        parentId: null,
      })

      await service.deletePage('leaf-1', ORG_ID)
      expect(repo.softDeleteMany).toHaveBeenCalledWith(['leaf-1'], ORG_ID)
      expect(repo.delete).not.toHaveBeenCalled()
    })

    it('cascade soft-deletes parent and all descendants', async () => {
      // parent-1 -> child-1 -> gc-1
      //           -> child-2
      repo._pages.push(
        { id: 'parent-1', organizationId: ORG_ID, title: 'Parent', emoji: null, content: null, order: 1.0, isDeleted: false, createdAt: new Date(), updatedAt: new Date(), parentId: null },
        { id: 'child-1', organizationId: ORG_ID, title: 'Child 1', emoji: null, content: null, order: 1.0, isDeleted: false, createdAt: new Date(), updatedAt: new Date(), parentId: 'parent-1' },
        { id: 'gc-1', organizationId: ORG_ID, title: 'Grandchild 1', emoji: null, content: null, order: 1.0, isDeleted: false, createdAt: new Date(), updatedAt: new Date(), parentId: 'child-1' },
        { id: 'child-2', organizationId: ORG_ID, title: 'Child 2', emoji: null, content: null, order: 2.0, isDeleted: false, createdAt: new Date(), updatedAt: new Date(), parentId: 'parent-1' },
      )

      await service.deletePage('parent-1', ORG_ID)
      const call = (repo.softDeleteMany as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(call[1]).toBe(ORG_ID)
      // All 4 IDs must be present (BFS order: parent-1, child-1, child-2, gc-1)
      expect(call[0]).toHaveLength(4)
      expect(call[0]).toContain('parent-1')
      expect(call[0]).toContain('child-1')
      expect(call[0]).toContain('child-2')
      expect(call[0]).toContain('gc-1')
    })

    it('throws PAGE_NOT_FOUND when page does not exist', async () => {
      await expect(service.deletePage('nonexistent', ORG_ID)).rejects.toMatchObject({
        code: 'PAGE_NOT_FOUND',
      })
    })
  })

  describe('listTrashedPages', () => {
    it('delegates to repo.findAllTrashed and returns only deleted pages', async () => {
      repo._pages.push(
        { id: 'active-1', organizationId: ORG_ID, title: 'Active', emoji: null, content: null, order: 1.0, isDeleted: false, createdAt: new Date(), updatedAt: new Date(), parentId: null },
        { id: 'deleted-1', organizationId: ORG_ID, title: 'Deleted', emoji: null, content: null, order: 2.0, isDeleted: true, createdAt: new Date(), updatedAt: new Date(), parentId: null },
      )

      const result = await service.listTrashedPages(ORG_ID)
      expect(repo.findAllTrashed).toHaveBeenCalledWith(ORG_ID)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('deleted-1')
    })
  })

  describe('restorePage', () => {
    it('restores page and descendants when parent is not deleted', async () => {
      repo._pages.push(
        { id: 'parent-active', organizationId: ORG_ID, title: 'Active Parent', emoji: null, content: null, order: 1.0, isDeleted: false, createdAt: new Date(), updatedAt: new Date(), parentId: null },
        { id: 'page-1', organizationId: ORG_ID, title: 'To Restore', emoji: null, content: null, order: 2.0, isDeleted: true, createdAt: new Date(), updatedAt: new Date(), parentId: 'parent-active' },
        { id: 'child-of-page-1', organizationId: ORG_ID, title: 'Trashed Child', emoji: null, content: null, order: 1.0, isDeleted: true, createdAt: new Date(), updatedAt: new Date(), parentId: 'page-1' },
      )

      await service.restorePage('page-1', ORG_ID)
      expect(repo.restoreMany).toHaveBeenCalledWith(
        expect.arrayContaining(['page-1', 'child-of-page-1']),
        ORG_ID,
        'parent-active',
        'page-1',
      )
    })

    it('re-parents to root when original parent is trashed (D-09)', async () => {
      repo._pages.push(
        { id: 'deleted-parent', organizationId: ORG_ID, title: 'Deleted Parent', emoji: null, content: null, order: 1.0, isDeleted: true, createdAt: new Date(), updatedAt: new Date(), parentId: null },
        { id: 'page-1', organizationId: ORG_ID, title: 'To Restore', emoji: null, content: null, order: 2.0, isDeleted: true, createdAt: new Date(), updatedAt: new Date(), parentId: 'deleted-parent' },
      )

      await service.restorePage('page-1', ORG_ID)
      expect(repo.restoreMany).toHaveBeenCalledWith(
        expect.arrayContaining(['page-1']),
        ORG_ID,
        null,
        'page-1',
      )
    })

    it('keeps null parentId when page has no parent', async () => {
      repo._pages.push(
        { id: 'page-1', organizationId: ORG_ID, title: 'Root Page', emoji: null, content: null, order: 1.0, isDeleted: true, createdAt: new Date(), updatedAt: new Date(), parentId: null },
      )

      await service.restorePage('page-1', ORG_ID)
      expect(repo.restoreMany).toHaveBeenCalledWith(
        expect.arrayContaining(['page-1']),
        ORG_ID,
        null,
        'page-1',
      )
    })

    it('throws PAGE_NOT_FOUND when page does not exist', async () => {
      await expect(service.restorePage('nonexistent', ORG_ID)).rejects.toMatchObject({
        code: 'PAGE_NOT_FOUND',
      })
    })
  })

  describe('permanentlyDeletePage', () => {
    it('permanently deletes page and all trashed descendants', async () => {
      repo._pages.push(
        { id: 'page-1', organizationId: ORG_ID, title: 'Trashed', emoji: null, content: null, order: 1.0, isDeleted: true, createdAt: new Date(), updatedAt: new Date(), parentId: null },
        { id: 'child-1', organizationId: ORG_ID, title: 'Trashed Child', emoji: null, content: null, order: 1.0, isDeleted: true, createdAt: new Date(), updatedAt: new Date(), parentId: 'page-1' },
      )

      await service.permanentlyDeletePage('page-1', ORG_ID)
      const call = (repo.permanentlyDeleteMany as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(call[1]).toBe(ORG_ID)
      expect(call[0]).toContain('page-1')
      expect(call[0]).toContain('child-1')
    })

    it('throws PAGE_NOT_FOUND when page does not exist', async () => {
      await expect(service.permanentlyDeletePage('nonexistent', ORG_ID)).rejects.toMatchObject({
        code: 'PAGE_NOT_FOUND',
      })
    })
  })

  describe('emptyTrash', () => {
    it('delegates to repo.emptyTrash with the organization id', async () => {
      repo._pages.push(
        { id: 'trash-1', organizationId: ORG_ID, title: 'Trash 1', emoji: null, content: null, order: 1.0, isDeleted: true, createdAt: new Date(), updatedAt: new Date(), parentId: null },
        { id: 'trash-2', organizationId: ORG_ID, title: 'Trash 2', emoji: null, content: null, order: 2.0, isDeleted: true, createdAt: new Date(), updatedAt: new Date(), parentId: null },
      )

      await service.emptyTrash(ORG_ID)
      expect(repo.emptyTrash).toHaveBeenCalledWith(ORG_ID)
    })
  })

  describe('movePage', () => {
    it('updates parentId on successful move', async () => {
      repo._pages.push({
        id: 'page-1',
        organizationId: ORG_ID,
        title: 'Move Me',
        emoji: null,
        content: null,
        order: 1.0,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        parentId: null,
      })

      const result = await service.movePage('page-1', 'parent-id', ORG_ID)
      expect(result.parentId).toBe('parent-id')
      expect(repo.update).toHaveBeenCalledWith('page-1', { parentId: 'parent-id' }, ORG_ID)
    })

    it('throws INVALID_MOVE when id equals parentId', async () => {
      repo._pages.push({
        id: 'page-1',
        organizationId: ORG_ID,
        title: 'Self Move',
        emoji: null,
        content: null,
        order: 1.0,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        parentId: null,
      })

      await expect(service.movePage('page-1', 'page-1', ORG_ID)).rejects.toMatchObject({
        code: 'INVALID_MOVE',
      })
    })
  })

  describe('updateEmoji', () => {
    it('updates emoji to a new value', async () => {
      repo._pages.push({
        id: 'page-1',
        organizationId: ORG_ID,
        title: 'Emoji Page',
        emoji: null,
        content: null,
        order: 1.0,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        parentId: null,
      })

      const result = await service.updateEmoji('page-1', '🚀', ORG_ID)
      expect(result.emoji).toBe('🚀')
      expect(repo.update).toHaveBeenCalledWith('page-1', { emoji: '🚀' }, ORG_ID)
    })

    it('updates emoji to null (removes emoji)', async () => {
      repo._pages.push({
        id: 'page-1',
        organizationId: ORG_ID,
        title: 'Emoji Page',
        emoji: '🔥',
        content: null,
        order: 1.0,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        parentId: null,
      })

      const result = await service.updateEmoji('page-1', null, ORG_ID)
      expect(result.emoji).toBeNull()
      expect(repo.update).toHaveBeenCalledWith('page-1', { emoji: null }, ORG_ID)
    })
  })

  describe('updateContent', () => {
    it('updates content and returns updated page record when page exists', async () => {
      repo._pages.push({
        id: 'page-1',
        organizationId: ORG_ID,
        title: 'Content Page',
        emoji: null,
        content: null,
        order: 1.0,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        parentId: null,
      })

      const jsonContent = { type: 'doc', content: [] }
      const result = await service.updateContent('page-1', jsonContent, ORG_ID)
      expect(result.content).toEqual(jsonContent)
      expect(repo.update).toHaveBeenCalledWith('page-1', { content: jsonContent }, ORG_ID)
    })

    it('throws PAGE_NOT_FOUND when page does not exist', async () => {
      await expect(service.updateContent('nonexistent', {}, ORG_ID)).rejects.toMatchObject({
        code: 'PAGE_NOT_FOUND',
      })
    })
  })

  describe('findById', () => {
    it('returns page record when page exists in repo', async () => {
      repo._pages.push({
        id: 'page-1',
        organizationId: ORG_ID,
        title: 'Find Me',
        emoji: null,
        content: null,
        order: 1.0,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        parentId: null,
      })

      const result = await service.findById('page-1', ORG_ID)
      expect(result).not.toBeNull()
      expect(result?.id).toBe('page-1')
      expect(repo.findById).toHaveBeenCalledWith('page-1', ORG_ID)
    })

    it('returns null when page does not exist in repo', async () => {
      const result = await service.findById('nonexistent', ORG_ID)
      expect(result).toBeNull()
    })
  })

  describe('findAllForOrg', () => {
    it('delegates to repo.findAllForOrg and returns non-deleted pages', async () => {
      repo._pages.push(
        {
          id: 'page-1',
          organizationId: ORG_ID,
          title: 'Active Page',
          emoji: null,
          content: null,
          order: 1.0,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          parentId: null,
        },
        {
          id: 'page-2',
          organizationId: ORG_ID,
          title: 'Deleted Page',
          emoji: null,
          content: null,
          order: 2.0,
          isDeleted: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          parentId: null,
        }
      )

      const pages = await service.findAllForOrg(ORG_ID)
      expect(repo.findAllForOrg).toHaveBeenCalledWith(ORG_ID)
      expect(pages).toHaveLength(1)
      expect(pages[0].id).toBe('page-1')
    })
  })
})
