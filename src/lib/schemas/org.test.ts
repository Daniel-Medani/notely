import { describe, it, expect } from 'vitest'
import { orgCreateSchema, orgInviteSchema, orgMemberRoleSchema, orgRemoveMemberSchema } from './org'

describe('orgCreateSchema', () => {
  it('accepts valid name', () => {
    const result = orgCreateSchema.safeParse({ name: 'Acme Corp' })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = orgCreateSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path.includes('name'))
      expect(nameError).toBeDefined()
    }
  })

  it('rejects name shorter than 2 characters', () => {
    const result = orgCreateSchema.safeParse({ name: 'A' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path.includes('name'))
      expect(nameError?.message).toBe('Name must be at least 2 characters.')
    }
  })

  it('rejects name over 50 characters', () => {
    const result = orgCreateSchema.safeParse({ name: 'A'.repeat(51) })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path.includes('name'))
      expect(nameError?.message).toBe('Name is too long.')
    }
  })

  it('accepts name with exactly 2 characters', () => {
    const result = orgCreateSchema.safeParse({ name: 'AB' })
    expect(result.success).toBe(true)
  })

  it('accepts name with exactly 50 characters', () => {
    const result = orgCreateSchema.safeParse({ name: 'A'.repeat(50) })
    expect(result.success).toBe(true)
  })
})

describe('orgInviteSchema', () => {
  it('accepts valid input with admin role', () => {
    const result = orgInviteSchema.safeParse({
      organizationId: 'org-123',
      email: 'alice@example.com',
      role: 'admin',
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid input with member role', () => {
    const result = orgInviteSchema.safeParse({
      organizationId: 'org-123',
      email: 'bob@example.com',
      role: 'member',
    })
    expect(result.success).toBe(true)
  })

  it('rejects "owner" role', () => {
    const result = orgInviteSchema.safeParse({
      organizationId: 'org-123',
      email: 'carol@example.com',
      role: 'owner',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const roleError = result.error.issues.find((i) => i.path.includes('role'))
      expect(roleError).toBeDefined()
    }
  })

  it('rejects invalid email', () => {
    const result = orgInviteSchema.safeParse({
      organizationId: 'org-123',
      email: 'not-an-email',
      role: 'member',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const emailError = result.error.issues.find((i) => i.path.includes('email'))
      expect(emailError?.message).toBe('Enter a valid email address.')
    }
  })

  it('rejects missing organizationId', () => {
    const result = orgInviteSchema.safeParse({
      email: 'alice@example.com',
      role: 'member',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const orgError = result.error.issues.find((i) => i.path.includes('organizationId'))
      expect(orgError).toBeDefined()
    }
  })

  it('rejects empty organizationId', () => {
    const result = orgInviteSchema.safeParse({
      organizationId: '',
      email: 'alice@example.com',
      role: 'member',
    })
    expect(result.success).toBe(false)
  })
})

describe('orgMemberRoleSchema', () => {
  it('accepts valid admin role change', () => {
    const result = orgMemberRoleSchema.safeParse({
      organizationId: 'org-123',
      memberId: 'member-456',
      role: 'admin',
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid member role change', () => {
    const result = orgMemberRoleSchema.safeParse({
      organizationId: 'org-123',
      memberId: 'member-456',
      role: 'member',
    })
    expect(result.success).toBe(true)
  })

  it('rejects "owner" role', () => {
    const result = orgMemberRoleSchema.safeParse({
      organizationId: 'org-123',
      memberId: 'member-456',
      role: 'owner',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const roleError = result.error.issues.find((i) => i.path.includes('role'))
      expect(roleError).toBeDefined()
    }
  })
})

describe('orgRemoveMemberSchema', () => {
  it('accepts valid input', () => {
    const result = orgRemoveMemberSchema.safeParse({
      organizationId: 'org-123',
      memberId: 'member-456',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing memberId', () => {
    const result = orgRemoveMemberSchema.safeParse({
      organizationId: 'org-123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const memberError = result.error.issues.find((i) => i.path.includes('memberId'))
      expect(memberError).toBeDefined()
    }
  })

  it('rejects empty memberId', () => {
    const result = orgRemoveMemberSchema.safeParse({
      organizationId: 'org-123',
      memberId: '',
    })
    expect(result.success).toBe(false)
  })
})
