'use server'

import { revalidatePath } from 'next/cache'
import { verifySession } from '@/lib/dal'
import { handleActionError, AppError, type ActionResult } from '@/lib/errors'
import {
  pageCreateSchema,
  pageRenameSchema,
  pageDeleteSchema,
  pageMoveSchema,
  pageEmojiSchema,
  pageContentSchema,
  pageRestoreSchema,
  pagePermanentDeleteSchema,
  pageEmptyTrashSchema,
} from '@/lib/schemas/page'
import { checkRateLimit } from '@/lib/ratelimit'
import { sanitizeContent } from '@/lib/editor/sanitize-content'
import { PageService } from '@/services/page-service'
import { PrismaPageRepository } from '@/repositories/prisma/prisma-page-repository'
import { prisma } from '@/lib/db'
import type { PageRecord } from '@/repositories/interfaces/IPageRepository'

const pageService = new PageService(new PrismaPageRepository())

/**
 * Verifies the authenticated user is a member of the given organization.
 * Throws AppError('FORBIDDEN') if not.
 */
async function assertMembership(userId: string, organizationId: string): Promise<void> {
  const member = await prisma.member.findFirst({
    where: { userId, organizationId },
  })
  if (!member) throw new AppError('Forbidden.', 'FORBIDDEN', 403)
}

export async function createPageAction(input: unknown): Promise<ActionResult<PageRecord>> {
  try {
    const session = await verifySession()
    await checkRateLimit(session.user.id)
    const parsed = pageCreateSchema.parse(input)
    await assertMembership(session.user.id, parsed.organizationId)
    const page = await pageService.createPage(parsed.parentId ?? null, parsed.organizationId)
    return { success: true, data: page }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function renamePageAction(input: unknown): Promise<ActionResult<PageRecord>> {
  try {
    const session = await verifySession()
    await checkRateLimit(session.user.id)
    const parsed = pageRenameSchema.parse(input)
    await assertMembership(session.user.id, parsed.organizationId)
    const page = await pageService.renamePage(parsed.id, parsed.title, parsed.organizationId)
    return { success: true, data: page }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function deletePageAction(input: unknown): Promise<ActionResult<void>> {
  try {
    const session = await verifySession()
    await checkRateLimit(session.user.id)
    const parsed = pageDeleteSchema.parse(input)
    await assertMembership(session.user.id, parsed.organizationId)
    await pageService.deletePage(parsed.id, parsed.organizationId)
    return { success: true, data: undefined }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function movePageAction(input: unknown): Promise<ActionResult<PageRecord>> {
  try {
    const session = await verifySession()
    await checkRateLimit(session.user.id)
    const parsed = pageMoveSchema.parse(input)
    await assertMembership(session.user.id, parsed.organizationId)
    const page = await pageService.movePage(parsed.id, parsed.parentId, parsed.organizationId)
    return { success: true, data: page }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function updateEmojiAction(input: unknown): Promise<ActionResult<PageRecord>> {
  try {
    const session = await verifySession()
    await checkRateLimit(session.user.id)
    const parsed = pageEmojiSchema.parse(input)
    await assertMembership(session.user.id, parsed.organizationId)
    const page = await pageService.updateEmoji(parsed.id, parsed.emoji, parsed.organizationId)
    return { success: true, data: page }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function updatePageContentAction(input: unknown): Promise<ActionResult<PageRecord>> {
  try {
    const session = await verifySession()
    await checkRateLimit(session.user.id)
    const parsed = pageContentSchema.parse(input)
    await assertMembership(session.user.id, parsed.organizationId)
    // JSON round-trip strips React's internal proxy that Next.js wraps Server Action
    // arguments in — Prisma's serializer cannot introspect proxy objects directly.
    const plain = JSON.parse(JSON.stringify(parsed.content))
    const sanitized = sanitizeContent(plain as Record<string, unknown>)
    const page = await pageService.updateContent(parsed.id, sanitized, parsed.organizationId)
    return { success: true, data: page }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function fetchPagesAction(organizationId: string): Promise<PageRecord[]> {
  const session = await verifySession()
  const member = await prisma.member.findFirst({
    where: { userId: session.user.id, organizationId },
  })
  if (!member) return []
  return pageService.findAllForOrg(organizationId)
}

export async function restorePageAction(input: unknown): Promise<ActionResult<void>> {
  try {
    const session = await verifySession()
    await checkRateLimit(session.user.id)
    const parsed = pageRestoreSchema.parse(input)
    await assertMembership(session.user.id, parsed.organizationId)
    await pageService.restorePage(parsed.id, parsed.organizationId)
    revalidatePath('/[org]', 'layout') // Refresh sidebar page tree
    revalidatePath('/[org]/trash', 'page') // Refresh trash list
    return { success: true, data: undefined }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function permanentlyDeletePageAction(input: unknown): Promise<ActionResult<void>> {
  try {
    const session = await verifySession()
    await checkRateLimit(session.user.id)
    const parsed = pagePermanentDeleteSchema.parse(input)
    await assertMembership(session.user.id, parsed.organizationId)
    await pageService.permanentlyDeletePage(parsed.id, parsed.organizationId)
    revalidatePath('/[org]/trash', 'page') // Refresh trash list
    return { success: true, data: undefined }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function emptyTrashAction(input: unknown): Promise<ActionResult<void>> {
  try {
    const session = await verifySession()
    await checkRateLimit(session.user.id)
    const parsed = pageEmptyTrashSchema.parse(input)
    await assertMembership(session.user.id, parsed.organizationId)
    await pageService.emptyTrash(parsed.organizationId)
    revalidatePath('/[org]/trash', 'page') // Refresh trash list
    return { success: true, data: undefined }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function fetchTrashedPagesAction(organizationId: string): Promise<PageRecord[]> {
  const session = await verifySession()
  const member = await prisma.member.findFirst({
    where: { userId: session.user.id, organizationId },
  })
  if (!member) return []
  return pageService.listTrashedPages(organizationId)
}
