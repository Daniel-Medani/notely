import type { IRepository } from './IRepository'

export interface CreatePageData {
  title?: string
  emoji?: string | null
  parentId?: string | null
  order: number
}

export interface UpdatePageData {
  title?: string
  emoji?: string | null
  parentId?: string | null
  order?: number
  isDeleted?: boolean
  content?: unknown  // TipTap JSONContent stored as Prisma Json
}

export interface PageRecord {
  id: string
  organizationId: string
  title: string
  emoji: string | null
  content: unknown
  order: number
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
  parentId: string | null
}

export interface IPageRepository extends IRepository<PageRecord, CreatePageData, UpdatePageData> {
  findAllForOrg(organizationId: string): Promise<PageRecord[]>
  findAllTrashed(organizationId: string): Promise<PageRecord[]>
  softDeleteMany(ids: string[], organizationId: string): Promise<void>
  restoreMany(ids: string[], organizationId: string, newParentId: string | null, rootId: string): Promise<void>
  permanentlyDeleteMany(ids: string[], organizationId: string): Promise<void>
  emptyTrash(organizationId: string): Promise<void>
}
