import { verifySession } from '@/lib/dal'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { MembersList } from '@/components/workspace/members-list'
import { InviteMemberForm } from '@/components/workspace/invite-member-form'
import { Separator } from '@/components/ui/separator'

export default async function MembersPage({ params }: { params: Promise<{ org: string }> }) {
  const session = await verifySession()
  const { org } = await params

  const organization = await prisma.organization.findFirst({
    where: { slug: org },
  })

  if (!organization) notFound()

  const result = await auth.api.listMembers({
    query: { organizationSlug: org },
    headers: await headers(),
  })

  const members = result?.members ?? []

  const currentMember = members.find((m) => m.userId === session.user.id)
  const isAdmin = currentMember?.role === 'admin' || currentMember?.role === 'owner'

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-semibold">Members ({members.length})</h1>
      {isAdmin && (
        <>
          <div className="mt-6">
            <InviteMemberForm organizationId={organization.id} />
          </div>
          <Separator className="my-6" />
        </>
      )}
      <MembersList
        members={members}
        organizationId={organization.id}
        organizationName={organization.name}
        currentUserId={session.user.id}
        isAdmin={isAdmin}
      />
    </div>
  )
}
