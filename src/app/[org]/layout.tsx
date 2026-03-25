import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/workspace/workspace-layout'
import { PageService } from '@/services/page-service'
import { PrismaPageRepository } from '@/repositories/prisma/prisma-page-repository'
import { PAGES_QUERY_KEY } from '@/lib/constants'

const pageService = new PageService(new PrismaPageRepository())

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

  // Prefetch pages for TanStack Query hydration
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({
    queryKey: PAGES_QUERY_KEY(organization.id),
    queryFn: () => pageService.findAllForOrg(organization.id),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WorkspaceLayout
        userName={session.user.name}
        userImage={session.user.image}
        organizationId={organization.id}
        orgSlug={org}
      >
        {children}
      </WorkspaceLayout>
    </HydrationBoundary>
  )
}
