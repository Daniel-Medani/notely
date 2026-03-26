import { headers } from 'next/headers'
import Link from 'next/link'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AcceptInvitationClient } from './accept-client'

interface InvitePageProps {
  params: Promise<{ invitationId: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { invitationId } = await params

  // Fetch invitation with organization details
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: { organization: { select: { name: true, slug: true } } },
  })

  // Not found state
  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-semibold">Invitation not found</CardTitle>
            <CardDescription>This invitation link is invalid.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Expired or used state
  const isExpired = invitation.expiresAt < new Date()
  const isUsed = invitation.status !== 'pending'

  if (isExpired || isUsed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-semibold">Invitation expired</CardTitle>
            <CardDescription>
              This invitation link has already been used or has expired.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Check session without redirecting — auth.api.getSession does NOT redirect to /login
  const session = await auth.api.getSession({ headers: await headers() })

  // Signed in — check if already a member
  if (session) {
    const existingMember = await prisma.member.findFirst({
      where: { userId: session.user.id, organizationId: invitation.organizationId },
    })

    if (existingMember) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-semibold">Already a member</CardTitle>
              <CardDescription>
                You&apos;re already a member of {invitation.organization.name}.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Button asChild>
                <Link href={`/${invitation.organization.slug}`}>Go to workspace</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    // Signed in, valid invitation — show accept button
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-semibold">You&apos;ve been invited</CardTitle>
            <CardDescription>Join {invitation.organization.name} on Notely.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <AcceptInvitationClient
              invitationId={invitationId}
              orgName={invitation.organization.name}
              orgSlug={invitation.organization.slug}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Not signed in — show sign in to accept button
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-semibold">You&apos;ve been invited</CardTitle>
          <CardDescription>Join {invitation.organization.name} on Notely.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Button asChild>
            <Link href={`/login?callbackUrl=/invite/${invitationId}`}>Sign in to accept</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
