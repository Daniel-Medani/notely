import type { ISearchRepository, SearchResult } from '@/repositories/interfaces/ISearchRepository'

export class SearchService {
  constructor(private readonly repo: ISearchRepository) {}

  async search(query: string, organizationId: string): Promise<SearchResult[]> {
    const trimmed = query.trim()
    if (!trimmed) return []
    return this.repo.search(trimmed, organizationId)
  }
}
