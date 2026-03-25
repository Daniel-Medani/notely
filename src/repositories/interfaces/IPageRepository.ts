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
}
