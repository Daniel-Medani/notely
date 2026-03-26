import { z } from 'zod'

export const orgCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(50, 'Name is too long.'),
})

export const orgInviteSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required.'),
  email: z.string().email('Enter a valid email address.'),
  role: z.enum(['admin', 'member']),
})

export const orgMemberRoleSchema = z.object({
  organizationId: z.string().min(1),
  memberId: z.string().min(1),
  role: z.enum(['admin', 'member']),
})

export const orgRemoveMemberSchema = z.object({
  organizationId: z.string().min(1),
  memberId: z.string().min(1),
})

export type OrgCreateInput = z.infer<typeof orgCreateSchema>
export type OrgInviteInput = z.infer<typeof orgInviteSchema>
export type OrgMemberRoleInput = z.infer<typeof orgMemberRoleSchema>
export type OrgRemoveMemberInput = z.infer<typeof orgRemoveMemberSchema>
