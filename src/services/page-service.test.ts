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
    it('soft-deletes the page by calling update with isDeleted: true (not delete)', async () => {
      repo._pages.push({
        id: 'page-1',
        organizationId: ORG_ID,
        title: 'To Delete',
        emoji: null,
        content: null,
        order: 1.0,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        parentId: null,
      })

      await service.deletePage('page-1', ORG_ID)
      expect(repo.update).toHaveBeenCalledWith('page-1', { isDeleted: true }, ORG_ID)
      expect(repo.delete).not.toHaveBeenCalled()
    })

    it('throws PAGE_NOT_FOUND when page does not exist', async () => {
      await expect(service.deletePage('nonexistent', ORG_ID)).rejects.toMatchObject({
        code: 'PAGE_NOT_FOUND',
      })
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
