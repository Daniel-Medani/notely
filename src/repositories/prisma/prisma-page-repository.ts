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
    // Build update object with only defined fields to avoid Prisma type discrimination issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.emoji !== undefined) updateData.emoji = data.emoji
    if (data.parentId !== undefined) updateData.parentId = data.parentId
    if (data.order !== undefined) updateData.order = data.order
    if (data.isDeleted !== undefined) updateData.isDeleted = data.isDeleted
    if (data.content !== undefined) updateData.content = data.content
    return prisma.page.update({
      where: { id },
      data: updateData,
    })
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await prisma.page.delete({ where: { id } })
  }

  async findAllTrashed(organizationId: string): Promise<PageRecord[]> {
    return prisma.page.findMany({
      where: { organizationId, isDeleted: true },
      orderBy: { updatedAt: 'desc' },
    })
  }

  async softDeleteMany(ids: string[], organizationId: string): Promise<void> {
    await prisma.page.updateMany({
      where: { id: { in: ids }, organizationId },
      data: { isDeleted: true },
    })
  }

  async restoreMany(ids: string[], organizationId: string, newParentId: string | null, rootId: string): Promise<void> {
    await prisma.page.updateMany({
      where: { id: { in: ids }, organizationId },
      data: { isDeleted: false },
    })
    // Update root page's parentId separately (only the root, not descendants)
    await prisma.page.update({
      where: { id: rootId },
      data: { parentId: newParentId },
    })
  }

  async permanentlyDeleteMany(ids: string[], organizationId: string): Promise<void> {
    await prisma.page.deleteMany({
      where: { id: { in: ids }, organizationId },
    })
  }

  async emptyTrash(organizationId: string): Promise<void> {
    await prisma.page.deleteMany({
      where: { organizationId, isDeleted: true },
    })
  }
}
