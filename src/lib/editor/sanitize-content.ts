/**
 * Server-side JSON sanitization for TipTap content.
 * Strips javascript: URLs from link marks and image src attributes.
 * See EDIT-10, CVE-2025-14284.
 */

interface JSONContent {
  type?: string
  attrs?: Record<string, unknown>
  content?: JSONContent[]
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
  text?: string
}

const JAVASCRIPT_URL_PATTERN = /^javascript:/i

function sanitizeMark(mark: { type: string; attrs?: Record<string, unknown> }): {
  type: string
  attrs?: Record<string, unknown>
} {
  if (mark.type === 'link' && mark.attrs) {
    const href = mark.attrs.href
    if (typeof href === 'string' && JAVASCRIPT_URL_PATTERN.test(href)) {
      return { ...mark, attrs: { ...mark.attrs, href: '' } }
    }
  }
  return mark
}

export function sanitizeContent(node: JSONContent): JSONContent {
  const result: JSONContent = { ...node }

  // Sanitize image src
  if (node.type === 'image' && node.attrs) {
    const src = node.attrs.src
    if (typeof src === 'string' && JAVASCRIPT_URL_PATTERN.test(src)) {
      result.attrs = { ...node.attrs, src: '' }
    }
  }

  // Sanitize link marks
  if (node.marks && node.marks.length > 0) {
    result.marks = node.marks.map(sanitizeMark)
  }

  // Recursively sanitize children
  if (node.content && node.content.length > 0) {
    result.content = node.content.map(sanitizeContent)
  }

  return result
}
