import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SearchResult } from '@/repositories/interfaces/ISearchRepository'

// Use vi.hoisted so mockSearch is available inside the vi.mock factory (which is hoisted)
const { mockSearch } = vi.hoisted(() => ({
  mockSearch: vi.fn(),
}))

// Mock modules before importing the action
vi.mock('@/lib/dal', () => ({
  verifySession: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    member: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock('@/services/search-service', () => ({
  SearchService: vi.fn(function () {
    return { search: mockSearch }
  }),
}))

vi.mock('@/repositories/prisma/prisma-search-repository', () => ({
  PrismaSearchRepository: vi.fn(function () {
    return {}
  }),
}))

const { mockCheckSearchRateLimit } = vi.hoisted(() => ({
  mockCheckSearchRateLimit: vi.fn(),
}))

vi.mock('@/lib/ratelimit', () => ({
  checkSearchRateLimit: mockCheckSearchRateLimit,
}))

import { searchPagesAction } from './search-actions'
import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/db'

const mockVerifySession = vi.mocked(verifySession)
const mockFindFirst = vi.mocked(prisma.member.findFirst)

const VALID_SESSION = {
  user: { id: 'user-1', name: 'Test User', email: 'test@example.com', emailVerified: true },
  session: {
    id: 'session-1',
    token: 'token',
    userId: 'user-1',
    expiresAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
}

const VALID_MEMBER = {
  id: 'member-1',
  organizationId: 'org-1',
  userId: 'user-1',
  role: 'member',
  createdAt: new Date(),
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCheckSearchRateLimit.mockResolvedValue(undefined)
})

describe('searchPagesAction', () => {
  it('returns {success: true, data: SearchResult[]} when session and membership are valid', async () => {
    const mockResults: SearchResult[] = [
      { id: 'page-1', title: 'My Note', emoji: null, excerpt: 'excerpt text' },
    ]

    mockVerifySession.mockResolvedValue(VALID_SESSION as never)
    mockFindFirst.mockResolvedValue(VALID_MEMBER as never)
    mockSearch.mockResolvedValue(mockResults)

    const result = await searchPagesAction({ query: 'My Note', organizationId: 'org-1' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(mockResults)
    }
  })

  it('returns {success: false} when no session exists (verifySession redirects)', async () => {
    // verifySession calls redirect() which throws a Next.js redirect error
    mockVerifySession.mockRejectedValue(new Error('NEXT_REDIRECT'))

    const result = await searchPagesAction({ query: 'hello', organizationId: 'org-1' })

    expect(result.success).toBe(false)
  })

  it('returns {success: false, code: "FORBIDDEN"} when user is not a member of the org', async () => {
    mockVerifySession.mockResolvedValue(VALID_SESSION as never)
    mockFindFirst.mockResolvedValue(null)

    const result = await searchPagesAction({ query: 'hello', organizationId: 'org-1' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.code).toBe('FORBIDDEN')
    }
  })

  it('returns {success: false} when query is too short (Zod validation fails)', async () => {
    mockVerifySession.mockResolvedValue(VALID_SESSION as never)
    mockFindFirst.mockResolvedValue(VALID_MEMBER as never)

    const result = await searchPagesAction({ query: 'h', organizationId: 'org-1' })

    expect(result.success).toBe(false)
  })

  it('calls searchService.search with parsed query and organizationId', async () => {
    const mockResults: SearchResult[] = []

    mockVerifySession.mockResolvedValue(VALID_SESSION as never)
    mockFindFirst.mockResolvedValue(VALID_MEMBER as never)
    mockSearch.mockResolvedValue(mockResults)

    await searchPagesAction({ query: 'search term', organizationId: 'org-1' })

    expect(mockSearch).toHaveBeenCalledWith('search term', 'org-1')
  })

  it('returns rate limited error when checkSearchRateLimit throws', async () => {
    const { AppError } = await import('@/lib/errors')
    mockVerifySession.mockResolvedValue(VALID_SESSION as never)
    mockCheckSearchRateLimit.mockRejectedValue(
      new AppError('Too many requests. Please wait a moment and try again.', 'RATE_LIMITED', 429),
    )

    const result = await searchPagesAction({ query: 'hello world', organizationId: 'org-1' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.code).toBe('RATE_LIMITED')
    }
  })
})
