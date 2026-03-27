'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { verifySession } from '@/lib/dal'
import { handleActionError, AppError, type ActionResult } from '@/lib/errors'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  orgCreateSchema,
  orgInviteSchema,
  orgMemberRoleSchema,
  orgRemoveMemberSchema,
} from '@/lib/schemas/org'
import { checkRateLimit } from '@/lib/ratelimit'

/**
 * Converts a human-readable name to a URL-safe slug.
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

/**
 * Asserts that the authenticated user is an admin (or owner) of the given organization.
 * Throws AppError('FORBIDDEN') if the user is not a member or is not an admin.
 */
async function assertAdminMembership(userId: string, organizationId: string): Promise<void> {
  const member = await prisma.member.findFirst({
    where: { userId, organizationId },
  })
  if (!member) throw new AppError('Forbidden.', 'FORBIDDEN', 403)
  if (member.role !== 'admin' && member.role !== 'owner') {
    throw new AppError('Only admins can perform this action.', 'FORBIDDEN', 403)
  }
}

/**
 * Creates a new organization with the authenticated user as the admin.
 * Returns the slug of the created organization.
 */
export async function createOrgAction(input: unknown): Promise<ActionResult<{ slug: string }>> {
  try {
    const session = await verifySession()
    await checkRateLimit(session.user.id)
    const parsed = orgCreateSchema.parse(input)
    const slug = `${slugify(parsed.name)}-${crypto.randomUUID().slice(0, 4)}`
    await auth.api.createOrganization({
      body: { name: parsed.name, slug },
      headers: await headers(),
    })
    return { success: true, data: { slug } }
  } catch (err) {
    return handleActionError(err)
  }
}

/**
 * Invites a user to an organization by email.
 * Caller must be an admin of the organization.
 */
export async function inviteMemberAction(input: unknown): Promise<ActionResult<void>> {
  try {
    const session = await verifySession()
    await checkRateLimit(session.user.id)
    const parsed = orgInviteSchema.parse(input)
    await assertAdminMembership(session.user.id, parsed.organizationId)
    await auth.api.createInvitation({
      body: {
        email: parsed.email,
        role: parsed.role,
        organizationId: parsed.organizationId,
      },
      headers: await headers(),
    })
    return { success: true, data: undefined }
  } catch (err) {
    return handleActionError(err)
  }
}

/**
 * Removes a member from an organization.
 * Caller must be an admin of the organization.
 */
export async function removeMemberAction(input: unknown): Promise<ActionResult<void>> {
  try {
    const session = await verifySession()
    await checkRateLimit(session.user.id)
    const parsed = orgRemoveMemberSchema.parse(input)
    await assertAdminMembership(session.user.id, parsed.organizationId)
    await auth.api.removeMember({
      body: {
        memberIdOrEmail: parsed.memberId,
        organizationId: parsed.organizationId,
      },
      headers: await headers(),
    })
    revalidatePath('/[org]/settings/members', 'page')
    return { success: true, data: undefined }
  } catch (err) {
    return handleActionError(err)
  }
}

/**
 * Updates a member's role in an organization.
 * Caller must be an admin of the organization.
 */
export async function updateMemberRoleAction(input: unknown): Promise<ActionResult<void>> {
  try {
    const session = await verifySession()
    await checkRateLimit(session.user.id)
    const parsed = orgMemberRoleSchema.parse(input)
    await assertAdminMembership(session.user.id, parsed.organizationId)
    await auth.api.updateMemberRole({
      body: {
        memberId: parsed.memberId,
        role: parsed.role,
        organizationId: parsed.organizationId,
      },
      headers: await headers(),
    })
    revalidatePath('/[org]/settings/members', 'page')
    return { success: true, data: undefined }
  } catch (err) {
    return handleActionError(err)
  }
}

/**
 * Accepts an invitation to join an organization.
 * Returns the slug of the organization the user has joined.
 */
export async function acceptInvitationAction(
  invitationId: string,
): Promise<ActionResult<{ orgSlug: string }>> {
  try {
    const session = await verifySession()
    await checkRateLimit(session.user.id)
    await auth.api.acceptInvitation({
      body: { invitationId },
      headers: await headers(),
    })
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    })
    if (!invitation) {
      throw new AppError('Invitation not found.', 'NOT_FOUND', 404)
    }
    const organization = await prisma.organization.findUnique({
      where: { id: invitation.organizationId },
      select: { slug: true },
    })
    if (!organization) {
      throw new AppError('Organization not found.', 'NOT_FOUND', 404)
    }
    return { success: true, data: { orgSlug: organization.slug } }
  } catch (err) {
    return handleActionError(err)
  }
}

/**
 * Gets the details of a pending invitation.
 * Does not require authentication (used on the /invite public page).
 */
export async function getInvitationAction(invitationId: string): Promise<
  ActionResult<{
    id: string
    organizationName: string
    inviterEmail: string
    email: string
    status: string
    expiresAt: Date
  }>
> {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    })
    if (!invitation) {
      throw new AppError('Invitation not found.', 'NOT_FOUND', 404)
    }
    const organization = await prisma.organization.findUnique({
      where: { id: invitation.organizationId },
      select: { name: true },
    })
    const inviter = await prisma.user.findUnique({
      where: { id: invitation.inviterId },
      select: { email: true },
    })
    return {
      success: true,
      data: {
        id: invitation.id,
        organizationName: organization?.name ?? '',
        inviterEmail: inviter?.email ?? '',
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
    }
  } catch (err) {
    return handleActionError(err)
  }
}
