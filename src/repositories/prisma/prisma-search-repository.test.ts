import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaSearchRepository } from './prisma-search-repository'

// Integration test — requires a real PostgreSQL database
// Run with: npx vitest run --pool=forks

let prisma: PrismaClient

beforeAll(async () => {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  prisma = new PrismaClient({ adapter })
})

afterAll(async () => {
  await prisma.$disconnect()
})

// Use unique org IDs per test run to avoid cross-test interference
const ORG_A = `test-org-a-${Date.now()}`
const ORG_B = `test-org-b-${Date.now()}`

beforeEach(async () => {
  // Clean up test data before each test
  await prisma.page.deleteMany({
    where: {
      organizationId: { in: [ORG_A, ORG_B] },
    },
  })
})

afterAll(async () => {
  // Final cleanup
  await prisma.page.deleteMany({
    where: {
      organizationId: { in: [ORG_A, ORG_B] },
    },
  })
})

describe('PrismaSearchRepository', () => {
  it('returns pages matching query text in title', async () => {
    await prisma.page.create({
      data: {
        organizationId: ORG_A,
        title: 'PostgreSQL Full Text Search',
        order: 1.0,
        isDeleted: false,
      },
    })

    const repo = new PrismaSearchRepository()
    const results = await repo.search('Full Text Search', ORG_A)

    expect(results.length).toBeGreaterThan(0)
    expect(results[0].title).toBe('PostgreSQL Full Text Search')
  })

  it('returns pages matching query text in content', async () => {
    const contentJson = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'This page discusses elephant migration patterns' }],
        },
      ],
    }

    await prisma.page.create({
      data: {
        organizationId: ORG_A,
        title: 'Wildlife Notes',
        content: contentJson,
        order: 2.0,
        isDeleted: false,
      },
    })

    const repo = new PrismaSearchRepository()
    const results = await repo.search('elephant migration', ORG_A)

    expect(results.length).toBeGreaterThan(0)
    expect(results[0].title).toBe('Wildlife Notes')
  })

  it('does NOT return pages from a different organizationId (cross-tenant isolation)', async () => {
    // Create page in ORG_A
    await prisma.page.create({
      data: {
        organizationId: ORG_A,
        title: 'Secret Organization Data',
        order: 1.0,
        isDeleted: false,
      },
    })

    // Search from ORG_B — should NOT see ORG_A's pages
    const repo = new PrismaSearchRepository()
    const results = await repo.search('Secret Organization', ORG_B)

    expect(results).toHaveLength(0)
  })

  it('does NOT return pages where isDeleted=true', async () => {
    await prisma.page.create({
      data: {
        organizationId: ORG_A,
        title: 'This page has been deleted forever',
        order: 1.0,
        isDeleted: true,
      },
    })

    const repo = new PrismaSearchRepository()
    const results = await repo.search('deleted forever', ORG_A)

    expect(results).toHaveLength(0)
  })

  it('returns empty array for non-matching query', async () => {
    await prisma.page.create({
      data: {
        organizationId: ORG_A,
        title: 'My Cats and Dogs Notes',
        order: 1.0,
        isDeleted: false,
      },
    })

    const repo = new PrismaSearchRepository()
    const results = await repo.search('xyzzy-nonexistent-term', ORG_A)

    expect(results).toEqual([])
  })

  it('each result has id, title, emoji, excerpt fields', async () => {
    await prisma.page.create({
      data: {
        organizationId: ORG_A,
        title: 'Recipe for chocolate cake',
        emoji: '🍰',
        order: 1.0,
        isDeleted: false,
      },
    })

    const repo = new PrismaSearchRepository()
    const results = await repo.search('chocolate cake', ORG_A)

    expect(results.length).toBeGreaterThan(0)
    const result = results[0]
    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('title')
    expect(result).toHaveProperty('emoji')
    expect(result).toHaveProperty('excerpt')
    expect(typeof result.id).toBe('string')
    expect(typeof result.title).toBe('string')
    expect(typeof result.excerpt).toBe('string')
    // emoji can be string or null
    expect(result.emoji === null || typeof result.emoji === 'string').toBe(true)
    expect(result.emoji).toBe('🍰')
  })

  it('returns empty array for empty string without hitting DB', async () => {
    const repo = new PrismaSearchRepository()
    const results = await repo.search('', ORG_A)

    expect(results).toEqual([])
  })

  it('returns empty array for whitespace-only string without hitting DB', async () => {
    const repo = new PrismaSearchRepository()
    const results = await repo.search('   ', ORG_A)

    expect(results).toEqual([])
  })
})
