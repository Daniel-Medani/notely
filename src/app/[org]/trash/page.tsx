import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { fetchTrashedPagesAction } from '@/lib/actions/page-actions'
import { TrashList } from '@/components/workspace/trash-list'

export default async function TrashPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params

  const organization = await prisma.organization.findFirst({
    where: { slug: org },
  })

  if (!organization) notFound()

  // Membership already verified by [org]/layout.tsx (TNNT-02)
  const trashedPages = await fetchTrashedPagesAction(organization.id)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-semibold">Trash</h1>
      <div className="mt-6">
        <TrashList pages={trashedPages} organizationId={organization.id} orgSlug={org} />
      </div>
    </div>
  )
}
