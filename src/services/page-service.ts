import { AppError } from '@/lib/errors'
import type { IPageRepository, PageRecord } from '@/repositories/interfaces/IPageRepository'

export class PageService {
  constructor(private repo: IPageRepository) {}

  async createPage(parentId: string | null | undefined, organizationId: string): Promise<PageRecord> {
    const allPages = await this.repo.findAllForOrg(organizationId)
    const siblings = allPages.filter(p => p.parentId === (parentId ?? null))
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
    await this.repo.update(id, { isDeleted: true }, organizationId)
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

  async findAllForOrg(organizationId: string): Promise<PageRecord[]> {
    return this.repo.findAllForOrg(organizationId)
  }
}
