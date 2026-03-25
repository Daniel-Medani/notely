import 'server-only'
import { PrismaClient } from '@/generated/prisma'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  // Use Neon WebSocket adapter in production (Vercel + Neon)
  // Use standard pg adapter locally (Docker Postgres)
  if (process.env.NODE_ENV === 'production') {
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
    return new PrismaClient({ adapter })
  }
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
