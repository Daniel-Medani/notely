import 'server-only'
import { prisma } from '@/lib/db'
import type { IPageRepository, CreatePageData, UpdatePageData, PageRecord } from '../interfaces/IPageRepository'

export class PrismaPageRepository implements IPageRepository {
  async findById(id: string, organizationId: string): Promise<PageRecord | null> {
    return prisma.page.findFirst({ where: { id, organizationId } })
  }

  async findAll(organizationId: string): Promise<PageRecord[]> {
    return prisma.page.findMany({
      where: { organizationId },
      orderBy: { order: 'asc' },
    })
  }

  async findAllForOrg(organizationId: string): Promise<PageRecord[]> {
    return prisma.page.findMany({
      where: { organizationId, isDeleted: false },
      orderBy: { order: 'asc' },
    })
  }

  async create(data: CreatePageData, organizationId: string): Promise<PageRecord> {
    return prisma.page.create({
      data: {
        organizationId,
        title: data.title ?? 'Untitled',
        emoji: data.emoji ?? null,
        parentId: data.parentId ?? null,
        order: data.order,
      },
    })
  }

  async update(id: string, data: UpdatePageData, organizationId: string): Promise<PageRecord> {
    return prisma.page.update({
      where: { id },
      data: { ...data, organizationId: undefined },
    })
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await prisma.page.delete({ where: { id } })
  }
}
