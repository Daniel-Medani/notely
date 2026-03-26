import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use vi.hoisted so mockPageService is available inside the vi.mock factory (which is hoisted)
const { mockPageService } = vi.hoisted(() => ({
  mockPageService: {
    restorePage: vi.fn(),
    permanentlyDeletePage: vi.fn(),
    emptyTrash: vi.fn(),
    listTrashedPages: vi.fn(),
    deletePage: vi.fn(),
    createPage: vi.fn(),
    renamePage: vi.fn(),
    movePage: vi.fn(),
    updateEmoji: vi.fn(),
    updateContent: vi.fn(),
    findById: vi.fn(),
    findAllForOrg: vi.fn(),
  },
}))

// Mock modules before importing the action
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

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

vi.mock('@/services/page-service', () => ({
  PageService: vi.fn(function () {
    return mockPageService
  }),
}))

vi.mock('@/repositories/prisma/prisma-page-repository', () => ({
  PrismaPageRepository: vi.fn(function () {
    return {}
  }),
}))

vi.mock('@/lib/editor/sanitize-content', () => ({
  sanitizeContent: vi.fn((c: unknown) => c),
}))

import {
  restorePageAction,
  permanentlyDeletePageAction,
  emptyTrashAction,
  fetchTrashedPagesAction,
  deletePageAction,
} from './page-actions'
import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

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

const MEMBER = {
  id: 'member-1',
  organizationId: 'org-1',
  userId: 'user-1',
  role: 'member',
  createdAt: new Date(),
}

const SAMPLE_PAGE = {
  id: 'page-1',
  organizationId: 'org-1',
  title: 'Deleted Page',
  parentId: null,
  order: 1.0,
  emoji: null,
  content: null,
  isDeleted: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('restorePageAction', () => {
  it('returns { success: true } with valid session and membership', async () => {
    mockVerifySession.mockResolvedValue(VALID_SESSION as never)
    mockFindFirst.mockResolvedValue(MEMBER as never)
    mockPageService.restorePage.mockResolvedValue(undefined)

    const result = await restorePageAction({ id: 'page-1', organizationId: 'org-1' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBeUndefined()
    }
  })

  it('calls pageService.restorePage with correct args', async () => {
    mockVerifySession.mockResolvedValue(VALID_SESSION as never)
    mockFindFirst.mockResolvedValue(MEMBER as never)
    mockPageService.restorePage.mockResolvedValue(undefined)

    await restorePageAction({ id: 'page-1', organizationId: 'org-1' })

    expect(mockPageService.restorePage).toHaveBeenCalledWith('page-1', 'org-1')
  })

  it('calls revalidatePath for sidebar layout and trash page after success', async () => {
    mockVerifySession.mockResolvedValue(VALID_SESSION as never)
    mockFindFirst.mockResolvedValue(MEMBER as never)
    mockPageService.restorePage.mockResolvedValue(undefined)

    await restorePageAction({ id: 'page-1', organizationId: 'org-1' })

    expect(revalidatePath).toHaveBeenCalledWith('/[org]', 'layout')
    expect(revalidatePath).toHaveBeenCalledWith('/[org]/trash', 'page')
  })

  it('returns { success: false } when id is empty (Zod validation fails)', async () => {
    mockVerifySession.mockResolvedValue(VALID_SESSION as never)

    const result = await restorePageAction({ id: '', organizationId: 'org-1' })

    expect(result.success).toBe(false)
  })

  it('returns { success: false, code: "FORBIDDEN" } when user is not a member', async () => {
    mockVerifySession.mockResolvedValue(VALID_SESSION as never)
    mockFindFirst.mockResolvedValue(null)

    const result = await restorePageAction({ id: 'page-1', organizationId: 'org-1' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.code).toBe('FORBIDDEN')
    }
  })
})

describe('permanentlyDeletePageAction', () => {
  it('returns { success: true } with valid session and membership', async () => {
    mockVerifySession.mockResolvedValue(VALID_SESSION as never)
    mockFindFirst.mockResolvedValue(MEMBER as never)
    mockPageService.permanentlyDeletePage.mockResolvedValue(undefined)

    const result = await permanentlyDeletePageAction({ id: 'page-1', organizationId: 'org-1' })

    expect(result.success).toBe(true)
  })

  it('calls pageService.permanentlyDeletePage with correct args', async () => {
    mockVerifySession.mockResolvedValue(VALID_SESSION as never)
    mockFindFirst.mockResolvedValue(MEMBER as never)
    mockPageService.permanentlyDeletePage.mockResolvedValue(undefined)

    await permanentlyDeletePageAction({ id: 'page-1', organizationId: 'org-1' })

    expect(mockPageService.permanentlyDeletePage).toHaveBeenCalledWith('page-1', 'org-1')
  })

  it('calls revalidatePath for trash page after success', async () => {
    mockVerifySession.mockResolvedValue(VALID_SESSION as never)
    mockFindFirst.mockResolvedValue(MEMBER as never)
    mockPageService.permanentlyDeletePage.mockResolvedValue(undefined)

    await permanentlyDeletePageAction({ id: 'page-1', organizationId: 'org-1' })

    expect(revalidatePath).toHaveBeenCalledWith('/[org]/trash', 'page')
  })

  it('returns { success: false, code: "FORBIDDEN" } when user is not a member', async () => {
    mockVerifySession.mockResolvedValue(VALID_SESSION as never)
    mockFindFirst.mockResolvedValue(null)

    const result = await permanentlyDeletePageAction({ id: 'page-1', organizationId: 'org-1' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.code).toBe('FORBIDDEN')
    }
  })
})

describe('emptyTrashAction', () => {
  it('returns { success: true } with valid session and membership', async () => {
    mockVerifySession.mockResolvedValue(VALID_SESSION as never)
    mockFindFirst.mockResolvedValue(MEMBER as never)
    mockPageService.emptyTrash.mockResolvedValue(undefined)

    const result = await emptyTrashAction({ organizationId: 'org-1' })

    expect(result.success).toBe(true)
  })

  it('calls pageService.emptyTrash with correct args', async () => {
    mockVerifySession.mockResolvedValue(VALID_SESSION as never)
    mockFindFirst.mockResolvedValue(MEMBER as never)
    mockPageService.emptyTrash.mockResolvedValue(undefined)

    await emptyTrashAction({ organizationId: 'org-1' })

    expect(mockPageService.emptyTrash).toHaveBeenCalledWith('org-1')
  })

  it('calls revalidatePath for trash page after success', async () => {
    mockVerifySession.mockResolvedValue(VALID_SESSION as never)
    mockFindFirst.mockResolvedValue(MEMBER as never)
    mockPageService.emptyTrash.mockResolvedValue(undefined)

    await emptyTrashAction({ organizationId: 'org-1' })

    expect(revalidatePath).toHaveBeenCalledWith('/[org]/trash', 'page')
  })

  it('returns { success: false, code: "FORBIDDEN" } when user is not a member', async () => {
    mockVerifySession.mockResolvedValue(VALID_SESSION as never)
    mockFindFirst.mockResolvedValue(null)

    const result = await emptyTrashAction({ organizationId: 'org-1' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.code).toBe('FORBIDDEN')
    }
  })
})

describe('fetchTrashedPagesAction', () => {
  it('returns PageRecord[] for a valid member', async () => {
    mockVerifySession.mockResolvedValue(VALID_SESSION as never)
    mockFindFirst.mockResolvedValue(MEMBER as never)
    mockPageService.listTrashedPages.mockResolvedValue([SAMPLE_PAGE])

    const result = await fetchTrashedPagesAction('org-1')

    expect(result).toEqual([SAMPLE_PAGE])
    expect(mockPageService.listTrashedPages).toHaveBeenCalledWith('org-1')
  })

  it('returns empty array when user is not a member', async () => {
    mockVerifySession.mockResolvedValue(VALID_SESSION as never)
    mockFindFirst.mockResolvedValue(null)

    const result = await fetchTrashedPagesAction('org-1')

    expect(result).toEqual([])
    expect(mockPageService.listTrashedPages).not.toHaveBeenCalled()
  })
})

describe('deletePageAction cascade verification', () => {
  it('calls pageService.deletePage (cascade soft-delete)', async () => {
    mockVerifySession.mockResolvedValue(VALID_SESSION as never)
    mockFindFirst.mockResolvedValue(MEMBER as never)
    mockPageService.deletePage.mockResolvedValue(undefined)

    const result = await deletePageAction({ id: 'page-1', organizationId: 'org-1' })

    expect(result.success).toBe(true)
    expect(mockPageService.deletePage).toHaveBeenCalledWith('page-1', 'org-1')
  })
})
