import { z } from 'zod'

export const searchQuerySchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required.'),
  query: z.string().min(2, 'Query must be at least 2 characters.').max(200, 'Query is too long.'),
})

export type SearchQueryInput = z.infer<typeof searchQuerySchema>
