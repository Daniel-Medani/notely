import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/workspace/workspace-layout'
import { PageService } from '@/services/page-service'
import { PrismaPageRepository } from '@/repositories/prisma/prisma-page-repository'
import { PAGES_QUERY_KEY, ORGS_QUERY_KEY } from '@/lib/constants'
import { auth } from '@/lib/auth'

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

  // Fetch user's org list for org switcher
  const headersObj = await headers()
  const orgList = await auth.api.listOrganizations({ headers: headersObj })

  // Prefetch pages and orgs for TanStack Query hydration
  const queryClient = new QueryClient()
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: PAGES_QUERY_KEY(organization.id),
      queryFn: () => pageService.findAllForOrg(organization.id),
    }),
    queryClient.prefetchQuery({
      queryKey: ORGS_QUERY_KEY(),
      queryFn: () => auth.api.listOrganizations({ headers: headersObj }),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WorkspaceLayout
        userName={session.user.name}
        userImage={session.user.image}
        organizationId={organization.id}
        orgSlug={org}
        orgName={organization.name}
        orgs={orgList.map((o) => ({ id: o.id, name: o.name, slug: o.slug }))}
      >
        {children}
      </WorkspaceLayout>
    </HydrationBoundary>
  )
}
