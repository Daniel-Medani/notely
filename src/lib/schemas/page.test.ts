import { describe, it, expect } from 'vitest'
import {
  pageCreateSchema,
  pageRenameSchema,
  pageMoveSchema,
  pageEmojiSchema,
  pageDeleteSchema,
} from './page'

const ORG_ID = 'org_abc123'

describe('pageCreateSchema', () => {
  it('accepts organizationId with no parentId', () => {
    const result = pageCreateSchema.safeParse({ organizationId: ORG_ID })
    expect(result.success).toBe(true)
  })

  it('accepts organizationId with null parentId', () => {
    const result = pageCreateSchema.safeParse({ organizationId: ORG_ID, parentId: null })
    expect(result.success).toBe(true)
  })

  it('accepts organizationId with a string parentId', () => {
    const result = pageCreateSchema.safeParse({ organizationId: ORG_ID, parentId: 'clxxx123' })
    expect(result.success).toBe(true)
  })

  it('rejects missing organizationId', () => {
    const result = pageCreateSchema.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success) {
      const orgError = result.error.issues.find((i) => i.path.includes('organizationId'))
      expect(orgError).toBeDefined()
    }
  })

  it('rejects empty string organizationId', () => {
    const result = pageCreateSchema.safeParse({ organizationId: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const orgError = result.error.issues.find((i) => i.path.includes('organizationId'))
      expect(orgError?.message).toBe('Organization ID is required.')
    }
  })
})

describe('pageRenameSchema', () => {
  it('accepts valid organizationId, id, and title', () => {
    const result = pageRenameSchema.safeParse({ organizationId: ORG_ID, id: 'clxxx123', title: 'My Page' })
    expect(result.success).toBe(true)
  })

  it('rejects missing organizationId', () => {
    const result = pageRenameSchema.safeParse({ id: 'clxxx123', title: 'My Page' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const orgError = result.error.issues.find((i) => i.path.includes('organizationId'))
      expect(orgError).toBeDefined()
    }
  })

  it('rejects missing id', () => {
    const result = pageRenameSchema.safeParse({ organizationId: ORG_ID, title: 'My Page' })
    expect(result.success).toBe(false)
  })

  it('rejects empty title', () => {
    const result = pageRenameSchema.safeParse({ organizationId: ORG_ID, id: 'clxxx123', title: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const titleError = result.error.issues.find((i) => i.path.includes('title'))
      expect(titleError?.message).toBe('Title cannot be empty.')
    }
  })

  it('rejects title longer than 255 characters', () => {
    const result = pageRenameSchema.safeParse({ organizationId: ORG_ID, id: 'clxxx123', title: 'a'.repeat(256) })
    expect(result.success).toBe(false)
    if (!result.success) {
      const titleError = result.error.issues.find((i) => i.path.includes('title'))
      expect(titleError?.message).toBe('Title is too long.')
    }
  })

  it('accepts title of exactly 255 characters', () => {
    const result = pageRenameSchema.safeParse({ organizationId: ORG_ID, id: 'clxxx123', title: 'a'.repeat(255) })
    expect(result.success).toBe(true)
  })
})

describe('pageMoveSchema', () => {
  it('accepts valid organizationId, id, and null parentId', () => {
    const result = pageMoveSchema.safeParse({ organizationId: ORG_ID, id: 'clxxx123', parentId: null })
    expect(result.success).toBe(true)
  })

  it('accepts valid organizationId, id, and string parentId', () => {
    const result = pageMoveSchema.safeParse({ organizationId: ORG_ID, id: 'clxxx123', parentId: 'clyyy456' })
    expect(result.success).toBe(true)
  })

  it('rejects missing organizationId', () => {
    const result = pageMoveSchema.safeParse({ id: 'clxxx123', parentId: null })
    expect(result.success).toBe(false)
    if (!result.success) {
      const orgError = result.error.issues.find((i) => i.path.includes('organizationId'))
      expect(orgError).toBeDefined()
    }
  })

  it('rejects missing id', () => {
    const result = pageMoveSchema.safeParse({ organizationId: ORG_ID, parentId: null })
    expect(result.success).toBe(false)
    if (!result.success) {
      const idError = result.error.issues.find((i) => i.path.includes('id'))
      expect(idError).toBeDefined()
    }
  })
})

describe('pageEmojiSchema', () => {
  it('accepts valid organizationId, id, and emoji string', () => {
    const result = pageEmojiSchema.safeParse({ organizationId: ORG_ID, id: 'clxxx123', emoji: '📄' })
    expect(result.success).toBe(true)
  })

  it('accepts null emoji (removal)', () => {
    const result = pageEmojiSchema.safeParse({ organizationId: ORG_ID, id: 'clxxx123', emoji: null })
    expect(result.success).toBe(true)
  })

  it('rejects missing organizationId', () => {
    const result = pageEmojiSchema.safeParse({ id: 'clxxx123', emoji: null })
    expect(result.success).toBe(false)
    if (!result.success) {
      const orgError = result.error.issues.find((i) => i.path.includes('organizationId'))
      expect(orgError).toBeDefined()
    }
  })

  it('rejects missing id', () => {
    const result = pageEmojiSchema.safeParse({ organizationId: ORG_ID, emoji: null })
    expect(result.success).toBe(false)
    if (!result.success) {
      const idError = result.error.issues.find((i) => i.path.includes('id'))
      expect(idError).toBeDefined()
    }
  })
})

describe('pageDeleteSchema', () => {
  it('accepts valid organizationId and id', () => {
    const result = pageDeleteSchema.safeParse({ organizationId: ORG_ID, id: 'clxxx123' })
    expect(result.success).toBe(true)
  })

  it('rejects missing organizationId', () => {
    const result = pageDeleteSchema.safeParse({ id: 'clxxx123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const orgError = result.error.issues.find((i) => i.path.includes('organizationId'))
      expect(orgError).toBeDefined()
    }
  })

  it('rejects missing id', () => {
    const result = pageDeleteSchema.safeParse({ organizationId: ORG_ID })
    expect(result.success).toBe(false)
  })

  it('rejects empty string id', () => {
    const result = pageDeleteSchema.safeParse({ organizationId: ORG_ID, id: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const idError = result.error.issues.find((i) => i.path.includes('id'))
      expect(idError?.message).toBe('Page ID is required.')
    }
  })
})
