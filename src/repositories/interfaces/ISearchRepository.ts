export interface SearchResult {
  id: string
  title: string
  emoji: string | null
  excerpt: string
}

export interface ISearchRepository {
  search(query: string, organizationId: string): Promise<SearchResult[]>
}
