import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await verifySession()

  // Find the user's first org (personal workspace created on signup)
  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
    orderBy: { createdAt: 'asc' },
  })

  if (!member) {
    // Edge case: user exists but has no org — should not happen with databaseHooks
    redirect('/login')
  }

  redirect(`/${member.organization.slug}`)
}
