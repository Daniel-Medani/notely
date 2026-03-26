'use server'

import { verifySession } from '@/lib/dal'
import { handleActionError, AppError, type ActionResult } from '@/lib/errors'
import { searchQuerySchema } from '@/lib/schemas/search'
import { SearchService } from '@/services/search-service'
import { PrismaSearchRepository } from '@/repositories/prisma/prisma-search-repository'
import { prisma } from '@/lib/db'
import type { SearchResult } from '@/repositories/interfaces/ISearchRepository'

const searchService = new SearchService(new PrismaSearchRepository())

export async function searchPagesAction(input: unknown): Promise<ActionResult<SearchResult[]>> {
  try {
    const session = await verifySession()
    const parsed = searchQuerySchema.parse(input)
    const member = await prisma.member.findFirst({
      where: { userId: session.user.id, organizationId: parsed.organizationId },
    })
    if (!member) throw new AppError('Forbidden.', 'FORBIDDEN', 403)
    const results = await searchService.search(parsed.query, parsed.organizationId)
    return { success: true, data: results }
  } catch (err) {
    return handleActionError(err)
  }
}
