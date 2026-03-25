import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ org: string }>
}) {
  const session = await verifySession() // AUTH-06: verify session
  const { org } = await params

  // TNNT-03: Resolve org from path segment
  const organization = await prisma.organization.findFirst({
    where: { slug: org },
  })

  if (!organization) notFound()

  // TNNT-02: Verify user is member of this org (prevents cross-tenant access)
  const member = await prisma.member.findFirst({
    where: {
      organizationId: organization.id,
      userId: session.user.id,
    },
  })

  if (!member) redirect('/login')

  return <>{children}</>
}
