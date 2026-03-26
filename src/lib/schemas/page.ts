import { z } from 'zod'

export const pageCreateSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required.'),
  parentId: z.string().nullable().optional(),
})

export const pageRenameSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required.'),
  id: z.string().min(1, 'Page ID is required.'),
  title: z.string().min(1, 'Title cannot be empty.').max(255, 'Title is too long.'),
})

export const pageMoveSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required.'),
  id: z.string().min(1, 'Page ID is required.'),
  parentId: z.string().nullable(),
})

export const pageEmojiSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required.'),
  id: z.string().min(1, 'Page ID is required.'),
  emoji: z.string().nullable(),
})

export const pageDeleteSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required.'),
  id: z.string().min(1, 'Page ID is required.'),
})

export const pageContentSchema = z.object({
  id: z.string().min(1, 'Page ID is required.'),
  organizationId: z.string().min(1, 'Organization ID is required.'),
  content: z.record(z.string(), z.unknown()),
})

export const pageRestoreSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required.'),
  id: z.string().min(1, 'Page ID is required.'),
})

export const pagePermanentDeleteSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required.'),
  id: z.string().min(1, 'Page ID is required.'),
})

export const pageEmptyTrashSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required.'),
})

export type PageCreateInput = z.infer<typeof pageCreateSchema>
export type PageRenameInput = z.infer<typeof pageRenameSchema>
export type PageMoveInput = z.infer<typeof pageMoveSchema>
export type PageEmojiInput = z.infer<typeof pageEmojiSchema>
export type PageDeleteInput = z.infer<typeof pageDeleteSchema>
export type PageContentInput = z.infer<typeof pageContentSchema>
export type PageRestoreInput = z.infer<typeof pageRestoreSchema>
export type PagePermanentDeleteInput = z.infer<typeof pagePermanentDeleteSchema>
export type PageEmptyTrashInput = z.infer<typeof pageEmptyTrashSchema>
