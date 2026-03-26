import 'server-only'
import { prisma } from '@/lib/db'
import type { ISearchRepository, SearchResult } from '../interfaces/ISearchRepository'

export class PrismaSearchRepository implements ISearchRepository {
  async search(query: string, organizationId: string): Promise<SearchResult[]> {
    const tsQuery = query.trim()
    if (!tsQuery) return []

    try {
      return await prisma.$queryRaw<SearchResult[]>`
        SELECT
          p.id,
          p.title,
          p.emoji,
          ts_headline(
            'english',
            p.title || ' ' || COALESCE(p.content::text, ''),
            plainto_tsquery('english', ${tsQuery}),
            'MaxFragments=1, MaxWords=20, MinWords=5, StartSel=**, StopSel=**'
          ) AS excerpt
        FROM "Page" p
        WHERE
          p."organizationId" = ${organizationId}
          AND p."isDeleted" = false
          AND to_tsvector('english', p.title || ' ' || COALESCE(p.content::text, ''))
              @@ plainto_tsquery('english', ${tsQuery})
        ORDER BY
          ts_rank(
            to_tsvector('english', p.title || ' ' || COALESCE(p.content::text, '')),
            plainto_tsquery('english', ${tsQuery})
          ) DESC
        LIMIT 8
      `
    } catch (error) {
      // Graceful degradation: return empty array on any PostgreSQL FTS error
      // (e.g., unusual input causing query parse failure)
      console.error('Search query failed:', error)
      return []
    }
  }
}
