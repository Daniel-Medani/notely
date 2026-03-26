import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'

// Must mock server-only before importing the repository
vi.mock('server-only', () => ({}))

import { PrismaClient } from '@/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaPageRepository } from './prisma-page-repository'

// Integration test — requires a real PostgreSQL database
// Run with: npx vitest run --pool=forks

let prisma: PrismaClient

// Use unique org IDs per test run to avoid cross-test interference
const ORG_A = `test-page-org-a-${Date.now()}`
const ORG_B = `test-page-org-b-${Date.now()}`

beforeAll(async () => {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  prisma = new PrismaClient({ adapter })
})

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
  await prisma.$disconnect()
})

describe('PrismaPageRepository - cross-tenant isolation', () => {
  it('findAll does NOT return pages from a different organization', async () => {
    // Create a page in ORG_A
    await prisma.page.create({
      data: {
        organizationId: ORG_A,
        title: 'Org A Secret',
        order: 1.0,
        isDeleted: false,
      },
    })

    const repo = new PrismaPageRepository()
    const results = await repo.findAll(ORG_B)

    expect(results.filter((p) => p.organizationId === ORG_A)).toHaveLength(0)
  })

  it('findById does NOT return a page from a different organization', async () => {
    // Create page in ORG_A
    const page = await prisma.page.create({
      data: {
        organizationId: ORG_A,
        title: 'Org A Private Page',
        order: 1.0,
        isDeleted: false,
      },
    })

    const repo = new PrismaPageRepository()
    // Query with ORG_B — should return null
    const result = await repo.findById(page.id, ORG_B)

    expect(result).toBeNull()
  })

  it('findAllTrashed does NOT return trashed pages from a different organization', async () => {
    // Create a trashed page in ORG_A
    await prisma.page.create({
      data: {
        organizationId: ORG_A,
        title: 'Org A Trashed Page',
        order: 1.0,
        isDeleted: true,
      },
    })

    const repo = new PrismaPageRepository()
    const results = await repo.findAllTrashed(ORG_B)

    expect(results.filter((p) => p.organizationId === ORG_A)).toHaveLength(0)
  })

  it('findAllForOrg does NOT return pages from a different organization', async () => {
    // Create a page in ORG_A
    await prisma.page.create({
      data: {
        organizationId: ORG_A,
        title: 'Org A Active Page',
        order: 1.0,
        isDeleted: false,
      },
    })

    const repo = new PrismaPageRepository()
    const results = await repo.findAllForOrg(ORG_B)

    expect(results.filter((p) => p.organizationId === ORG_A)).toHaveLength(0)
  })

  it('softDeleteMany does NOT affect pages in a different organization', async () => {
    // Create page in ORG_A (not deleted)
    const page = await prisma.page.create({
      data: {
        organizationId: ORG_A,
        title: 'Org A Protected Page',
        order: 1.0,
        isDeleted: false,
      },
    })

    const repo = new PrismaPageRepository()
    // Attempt to soft-delete the page using ORG_B — should have no effect
    await repo.softDeleteMany([page.id], ORG_B)

    // Verify the page in ORG_A still has isDeleted: false
    const unchanged = await prisma.page.findUnique({ where: { id: page.id } })
    expect(unchanged).not.toBeNull()
    expect(unchanged!.isDeleted).toBe(false)
  })
})
