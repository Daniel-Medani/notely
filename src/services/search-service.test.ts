import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SearchService } from './search-service'
import type { ISearchRepository, SearchResult } from '@/repositories/interfaces/ISearchRepository'

function createMockRepo(): ISearchRepository {
  return {
    search: vi.fn(),
  }
}

const ORG_ID = 'org-test-123'

describe('SearchService', () => {
  let repo: ISearchRepository & { search: ReturnType<typeof vi.fn> }
  let service: SearchService

  beforeEach(() => {
    repo = createMockRepo() as ISearchRepository & { search: ReturnType<typeof vi.fn> }
    service = new SearchService(repo)
  })

  it('calls repository.search with query and organizationId and returns results', async () => {
    const mockResults: SearchResult[] = [
      { id: 'page-1', title: 'Hello World', emoji: null, excerpt: 'hello world excerpt' },
    ]
    repo.search.mockResolvedValue(mockResults)

    const results = await service.search('hello', ORG_ID)

    expect(repo.search).toHaveBeenCalledWith('hello', ORG_ID)
    expect(results).toEqual(mockResults)
  })

  it('returns empty array when repository returns empty array', async () => {
    repo.search.mockResolvedValue([])

    const results = await service.search('hello', ORG_ID)

    expect(results).toEqual([])
    expect(repo.search).toHaveBeenCalledWith('hello', ORG_ID)
  })

  it('trims whitespace from query before calling repository', async () => {
    repo.search.mockResolvedValue([])

    await service.search('  hello  ', ORG_ID)

    expect(repo.search).toHaveBeenCalledWith('hello', ORG_ID)
  })

  it('returns empty array without calling repository when query is blank after trimming', async () => {
    const results = await service.search('   ', ORG_ID)

    expect(results).toEqual([])
    expect(repo.search).not.toHaveBeenCalled()
  })

  it('returns empty array without calling repository when query is empty string', async () => {
    const results = await service.search('', ORG_ID)

    expect(results).toEqual([])
    expect(repo.search).not.toHaveBeenCalled()
  })
})
