import { AppError } from '@/lib/errors'
import type { IPageRepository, PageRecord } from '@/repositories/interfaces/IPageRepository'

export class PageService {
  constructor(private repo: IPageRepository) {}

  private collectDescendantIds(rootId: string, allPages: PageRecord[]): string[] {
    const result: string[] = []
    const queue: string[] = [rootId]
    while (queue.length > 0) {
      const current = queue.shift()!
      result.push(current)
      const children = allPages.filter((p) => p.parentId === current)
      queue.push(...children.map((c) => c.id))
    }
    return result
  }

  async createPage(
    parentId: string | null | undefined,
    organizationId: string,
  ): Promise<PageRecord> {
    const allPages = await this.repo.findAllForOrg(organizationId)
    const siblings = allPages.filter((p) => p.parentId === (parentId ?? null))
    const maxOrder = siblings.reduce((max, p) => Math.max(max, p.order), 0)
    return this.repo.create({ parentId: parentId ?? null, order: maxOrder + 1.0 }, organizationId)
  }

  async renamePage(id: string, title: string, organizationId: string): Promise<PageRecord> {
    const page = await this.repo.findById(id, organizationId)
    if (!page) throw new AppError('Page not found.', 'PAGE_NOT_FOUND', 404)
    return this.repo.update(id, { title }, organizationId)
  }

  async deletePage(id: string, organizationId: string): Promise<void> {
    const page = await this.repo.findById(id, organizationId)
    if (!page) throw new AppError('Page not found.', 'PAGE_NOT_FOUND', 404)
    const allPages = await this.repo.findAllForOrg(organizationId)
    const descendantIds = this.collectDescendantIds(id, allPages)
    await this.repo.softDeleteMany(descendantIds, organizationId)
  }

  async listTrashedPages(organizationId: string): Promise<PageRecord[]> {
    return this.repo.findAllTrashed(organizationId)
  }

  async restorePage(id: string, organizationId: string): Promise<void> {
    const page = await this.repo.findById(id, organizationId)
    if (!page) throw new AppError('Page not found.', 'PAGE_NOT_FOUND', 404)

    let newParentId = page.parentId
    if (page.parentId) {
      const parent = await this.repo.findById(page.parentId, organizationId)
      if (!parent || parent.isDeleted) {
        newParentId = null
      }
    }

    const allPages = await this.repo.findAll(organizationId)
    const descendantIds = this.collectDescendantIds(
      id,
      allPages.filter((p) => p.isDeleted),
    )
    await this.repo.restoreMany(descendantIds, organizationId, newParentId, id)
  }

  async permanentlyDeletePage(id: string, organizationId: string): Promise<void> {
    const page = await this.repo.findById(id, organizationId)
    if (!page) throw new AppError('Page not found.', 'PAGE_NOT_FOUND', 404)

    const allPages = await this.repo.findAll(organizationId)
    const descendantIds = this.collectDescendantIds(id, allPages)
    await this.repo.permanentlyDeleteMany(descendantIds, organizationId)
  }

  async emptyTrash(organizationId: string): Promise<void> {
    await this.repo.emptyTrash(organizationId)
  }

  async movePage(id: string, parentId: string | null, organizationId: string): Promise<PageRecord> {
    const page = await this.repo.findById(id, organizationId)
    if (!page) throw new AppError('Page not found.', 'PAGE_NOT_FOUND', 404)
    if (parentId === id) throw new AppError('Cannot move page into itself.', 'INVALID_MOVE', 400)
    return this.repo.update(id, { parentId }, organizationId)
  }

  async updateEmoji(id: string, emoji: string | null, organizationId: string): Promise<PageRecord> {
    const page = await this.repo.findById(id, organizationId)
    if (!page) throw new AppError('Page not found.', 'PAGE_NOT_FOUND', 404)
    return this.repo.update(id, { emoji }, organizationId)
  }

  async updateContent(id: string, content: unknown, organizationId: string): Promise<PageRecord> {
    const page = await this.repo.findById(id, organizationId)
    if (!page) throw new AppError('Page not found.', 'PAGE_NOT_FOUND', 404)
    return this.repo.update(id, { content }, organizationId)
  }

  async findById(id: string, organizationId: string): Promise<PageRecord | null> {
    return this.repo.findById(id, organizationId)
  }

  async findAllForOrg(organizationId: string): Promise<PageRecord[]> {
    return this.repo.findAllForOrg(organizationId)
  }
}
