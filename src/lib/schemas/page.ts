import { z } from 'zod'

export const pageCreateSchema = z.object({
  parentId: z.string().nullable().optional(),
})

export const pageRenameSchema = z.object({
  id: z.string().min(1, 'Page ID is required.'),
  title: z.string().min(1, 'Title cannot be empty.').max(255, 'Title is too long.'),
})

export const pageMoveSchema = z.object({
  id: z.string().min(1, 'Page ID is required.'),
  parentId: z.string().nullable(),
})

export const pageEmojiSchema = z.object({
  id: z.string().min(1, 'Page ID is required.'),
  emoji: z.string().nullable(),
})

export const pageDeleteSchema = z.object({
  id: z.string().min(1, 'Page ID is required.'),
})

export type PageCreateInput = z.infer<typeof pageCreateSchema>
export type PageRenameInput = z.infer<typeof pageRenameSchema>
export type PageMoveInput = z.infer<typeof pageMoveSchema>
export type PageEmojiInput = z.infer<typeof pageEmojiSchema>
export type PageDeleteInput = z.infer<typeof pageDeleteSchema>
