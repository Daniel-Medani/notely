import { describe, it, expect } from 'vitest'
import { sanitizeContent } from './sanitize-content'

describe('sanitizeContent', () => {
  it('strips javascript: from link mark href', () => {
    const node = {
      type: 'text',
      text: 'click',
      marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
    }
    const result = sanitizeContent(node)
    expect(result.marks?.[0].attrs?.href).toBe('')
  })

  it('strips Javascript: (mixed case) from link mark href — case-insensitive', () => {
    const node = {
      type: 'text',
      text: 'click',
      marks: [{ type: 'link', attrs: { href: 'Javascript:alert(1)' } }],
    }
    const result = sanitizeContent(node)
    expect(result.marks?.[0].attrs?.href).toBe('')
  })

  it('strips JAVASCRIPT:void(0) from link mark href', () => {
    const node = {
      type: 'text',
      text: 'click',
      marks: [{ type: 'link', attrs: { href: 'JAVASCRIPT:void(0)' } }],
    }
    const result = sanitizeContent(node)
    expect(result.marks?.[0].attrs?.href).toBe('')
  })

  it('strips javascript: from image node src attribute', () => {
    const node = {
      type: 'image',
      attrs: { src: 'javascript:void(0)', alt: 'evil' },
    }
    const result = sanitizeContent(node)
    expect(result.attrs?.src).toBe('')
  })

  it('preserves valid https:// link marks unchanged', () => {
    const node = {
      type: 'text',
      text: 'click',
      marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
    }
    const result = sanitizeContent(node)
    expect(result.marks?.[0].attrs?.href).toBe('https://example.com')
  })

  it('preserves valid https:// image src unchanged', () => {
    const node = {
      type: 'image',
      attrs: { src: 'https://example.com/img.png' },
    }
    const result = sanitizeContent(node)
    expect(result.attrs?.src).toBe('https://example.com/img.png')
  })

  it('recursively sanitizes nested content arrays', () => {
    const node = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'click',
              marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
            },
          ],
        },
      ],
    }
    const result = sanitizeContent(node)
    const link = result.content?.[0].content?.[0].marks?.[0]
    expect(link?.attrs?.href).toBe('')
  })

  it('handles node with no marks and no content (passthrough)', () => {
    const node = {
      type: 'hardBreak',
    }
    const result = sanitizeContent(node)
    expect(result).toEqual({ type: 'hardBreak' })
  })
})
