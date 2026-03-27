import 'server-only'
import { PrismaClient } from '@/generated/prisma'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  // Use Neon WebSocket adapter when DATABASE_URL points to Neon (contains 'neon.tech')
  // Use standard pg adapter otherwise (Docker Postgres, local dev, CI)
  const isNeon = process.env.DATABASE_URL?.includes('neon.tech')
  if (isNeon) {
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
    return new PrismaClient({ adapter })
  }
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
