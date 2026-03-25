'use server'

import { verifySession } from '@/lib/dal'
import { handleActionError, type ActionResult } from '@/lib/errors'
import {
  pageCreateSchema,
  pageRenameSchema,
  pageDeleteSchema,
  pageMoveSchema,
  pageEmojiSchema,
} from '@/lib/schemas/page'
import { PageService } from '@/services/page-service'
import { PrismaPageRepository } from '@/repositories/prisma/prisma-page-repository'
import type { PageRecord } from '@/repositories/interfaces/IPageRepository'

const pageService = new PageService(new PrismaPageRepository())

export async function createPageAction(input: unknown): Promise<ActionResult<PageRecord>> {
  try {
    const session = await verifySession()
    const parsed = pageCreateSchema.parse(input)
    const orgId = session.session.activeOrganizationId
    if (!orgId) return { success: false, error: 'No active organization.', code: 'NO_ORG' }
    const page = await pageService.createPage(parsed.parentId ?? null, orgId)
    return { success: true, data: page }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function renamePageAction(input: unknown): Promise<ActionResult<PageRecord>> {
  try {
    const session = await verifySession()
    const parsed = pageRenameSchema.parse(input)
    const orgId = session.session.activeOrganizationId
    if (!orgId) return { success: false, error: 'No active organization.', code: 'NO_ORG' }
    const page = await pageService.renamePage(parsed.id, parsed.title, orgId)
    return { success: true, data: page }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function deletePageAction(input: unknown): Promise<ActionResult<void>> {
  try {
    const session = await verifySession()
    const parsed = pageDeleteSchema.parse(input)
    const orgId = session.session.activeOrganizationId
    if (!orgId) return { success: false, error: 'No active organization.', code: 'NO_ORG' }
    await pageService.deletePage(parsed.id, orgId)
    return { success: true, data: undefined }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function movePageAction(input: unknown): Promise<ActionResult<PageRecord>> {
  try {
    const session = await verifySession()
    const parsed = pageMoveSchema.parse(input)
    const orgId = session.session.activeOrganizationId
    if (!orgId) return { success: false, error: 'No active organization.', code: 'NO_ORG' }
    const page = await pageService.movePage(parsed.id, parsed.parentId, orgId)
    return { success: true, data: page }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function updateEmojiAction(input: unknown): Promise<ActionResult<PageRecord>> {
  try {
    const session = await verifySession()
    const parsed = pageEmojiSchema.parse(input)
    const orgId = session.session.activeOrganizationId
    if (!orgId) return { success: false, error: 'No active organization.', code: 'NO_ORG' }
    const page = await pageService.updateEmoji(parsed.id, parsed.emoji, orgId)
    return { success: true, data: page }
  } catch (err) {
    return handleActionError(err)
  }
}

export async function fetchPagesAction(): Promise<PageRecord[]> {
  const session = await verifySession()
  const orgId = session.session.activeOrganizationId
  if (!orgId) return []
  return pageService.findAllForOrg(orgId)
}
