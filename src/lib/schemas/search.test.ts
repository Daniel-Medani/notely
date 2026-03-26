import { describe, it, expect } from 'vitest'
import { searchQuerySchema } from './search'

describe('searchQuerySchema', () => {
  it('parses valid input with query and organizationId', () => {
    const result = searchQuerySchema.safeParse({ query: 'hello', organizationId: 'org-1' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.query).toBe('hello')
      expect(result.data.organizationId).toBe('org-1')
    }
  })

  it('rejects query shorter than 2 characters', () => {
    const result = searchQuerySchema.safeParse({ query: 'h', organizationId: 'org-1' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const queryError = result.error.issues.find((i) => i.path.includes('query'))
      expect(queryError?.message).toBe('Query must be at least 2 characters.')
    }
  })

  it('rejects query longer than 200 characters', () => {
    const result = searchQuerySchema.safeParse({
      query: 'a'.repeat(201),
      organizationId: 'org-1',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const queryError = result.error.issues.find((i) => i.path.includes('query'))
      expect(queryError).toBeDefined()
    }
  })

  it('rejects missing organizationId', () => {
    const result = searchQuerySchema.safeParse({ query: 'hello' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const orgError = result.error.issues.find((i) => i.path.includes('organizationId'))
      expect(orgError).toBeDefined()
    }
  })

  it('rejects empty string organizationId with required message', () => {
    const result = searchQuerySchema.safeParse({ query: 'hello', organizationId: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const orgError = result.error.issues.find((i) => i.path.includes('organizationId'))
      expect(orgError?.message).toBe('Organization ID is required.')
    }
  })

  it('accepts query of exactly 2 characters', () => {
    const result = searchQuerySchema.safeParse({ query: 'hi', organizationId: 'org-1' })
    expect(result.success).toBe(true)
  })

  it('accepts query of exactly 200 characters', () => {
    const result = searchQuerySchema.safeParse({
      query: 'a'.repeat(200),
      organizationId: 'org-1',
    })
    expect(result.success).toBe(true)
  })
})
