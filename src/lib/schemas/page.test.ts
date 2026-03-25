import { describe, it, expect } from 'vitest'
import {
  pageCreateSchema,
  pageRenameSchema,
  pageMoveSchema,
  pageEmojiSchema,
  pageDeleteSchema,
} from './page'

describe('pageCreateSchema', () => {
  it('accepts empty object (no parentId)', () => {
    const result = pageCreateSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts null parentId', () => {
    const result = pageCreateSchema.safeParse({ parentId: null })
    expect(result.success).toBe(true)
  })

  it('accepts a string parentId', () => {
    const result = pageCreateSchema.safeParse({ parentId: 'clxxx123' })
    expect(result.success).toBe(true)
  })
})

describe('pageRenameSchema', () => {
  it('accepts valid id and title', () => {
    const result = pageRenameSchema.safeParse({ id: 'clxxx123', title: 'My Page' })
    expect(result.success).toBe(true)
  })

  it('rejects missing id', () => {
    const result = pageRenameSchema.safeParse({ title: 'My Page' })
    expect(result.success).toBe(false)
  })

  it('rejects empty title', () => {
    const result = pageRenameSchema.safeParse({ id: 'clxxx123', title: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const titleError = result.error.issues.find((i) => i.path.includes('title'))
      expect(titleError?.message).toBe('Title cannot be empty.')
    }
  })

  it('rejects title longer than 255 characters', () => {
    const result = pageRenameSchema.safeParse({ id: 'clxxx123', title: 'a'.repeat(256) })
    expect(result.success).toBe(false)
    if (!result.success) {
      const titleError = result.error.issues.find((i) => i.path.includes('title'))
      expect(titleError?.message).toBe('Title is too long.')
    }
  })

  it('accepts title of exactly 255 characters', () => {
    const result = pageRenameSchema.safeParse({ id: 'clxxx123', title: 'a'.repeat(255) })
    expect(result.success).toBe(true)
  })
})

describe('pageMoveSchema', () => {
  it('accepts valid id and null parentId', () => {
    const result = pageMoveSchema.safeParse({ id: 'clxxx123', parentId: null })
    expect(result.success).toBe(true)
  })

  it('accepts valid id and string parentId', () => {
    const result = pageMoveSchema.safeParse({ id: 'clxxx123', parentId: 'clyyy456' })
    expect(result.success).toBe(true)
  })

  it('rejects missing id', () => {
    const result = pageMoveSchema.safeParse({ parentId: null })
    expect(result.success).toBe(false)
    if (!result.success) {
      const idError = result.error.issues.find((i) => i.path.includes('id'))
      expect(idError).toBeDefined()
    }
  })
})

describe('pageEmojiSchema', () => {
  it('accepts valid id and emoji string', () => {
    const result = pageEmojiSchema.safeParse({ id: 'clxxx123', emoji: '📄' })
    expect(result.success).toBe(true)
  })

  it('accepts null emoji (removal)', () => {
    const result = pageEmojiSchema.safeParse({ id: 'clxxx123', emoji: null })
    expect(result.success).toBe(true)
  })

  it('rejects missing id', () => {
    const result = pageEmojiSchema.safeParse({ emoji: null })
    expect(result.success).toBe(false)
    if (!result.success) {
      const idError = result.error.issues.find((i) => i.path.includes('id'))
      expect(idError).toBeDefined()
    }
  })
})

describe('pageDeleteSchema', () => {
  it('accepts valid id', () => {
    const result = pageDeleteSchema.safeParse({ id: 'clxxx123' })
    expect(result.success).toBe(true)
  })

  it('rejects missing id', () => {
    const result = pageDeleteSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects empty string id', () => {
    const result = pageDeleteSchema.safeParse({ id: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const idError = result.error.issues.find((i) => i.path.includes('id'))
      expect(idError?.message).toBe('Page ID is required.')
    }
  })
})
