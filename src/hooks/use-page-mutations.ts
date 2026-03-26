'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createPageAction,
  renamePageAction,
  deletePageAction,
  movePageAction,
  updateEmojiAction,
} from '@/lib/actions/page-actions'
import { useWorkspace } from '@/components/workspace/workspace-layout'
import { PAGES_QUERY_KEY } from '@/lib/constants'
import type { PageRecord } from '@/repositories/interfaces/IPageRepository'

export function usePageMutations() {
  const queryClient = useQueryClient()
  const { organizationId } = useWorkspace()
  const queryKey = PAGES_QUERY_KEY(organizationId)

  const createPage = useMutation({
    mutationFn: async (input: { parentId?: string | null }) => {
      const result = await createPageAction({ organizationId, ...input })
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<PageRecord[]>(queryKey)
      const allPages = previous ?? []
      const siblings = allPages.filter(p => p.parentId === (input.parentId ?? null))
      const maxOrder = siblings.reduce((max, p) => Math.max(max, p.order), 0)
      const optimistic: PageRecord = {
        id: `temp-${Date.now()}`,
        organizationId,
        title: 'Untitled',
        emoji: null,
        content: null,
        parentId: input.parentId ?? null,
        order: maxOrder + 1.0,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      queryClient.setQueryData<PageRecord[]>(queryKey, old => [...(old ?? []), optimistic])
      return { previous }
    },
    onError: (_err, _input, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
      toast.error("Couldn't create page. Please try again.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const renamePage = useMutation({
    mutationFn: async (input: { id: string; title: string }) => {
      const result = await renamePageAction({ organizationId, ...input })
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<PageRecord[]>(queryKey)
      queryClient.setQueryData<PageRecord[]>(queryKey, old =>
        (old ?? []).map(p => p.id === input.id ? { ...p, title: input.title } : p)
      )
      return { previous }
    },
    onError: (_err, _input, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
      toast.error("Couldn't rename page. Changes were not saved.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const deletePage = useMutation({
    mutationFn: async (input: { id: string }) => {
      const result = await deletePageAction({ organizationId, ...input })
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<PageRecord[]>(queryKey)
      queryClient.setQueryData<PageRecord[]>(queryKey, old =>
        (old ?? []).filter(p => p.id !== input.id)
      )
      return { previous }
    },
    onError: (_err, _input, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
      toast.error("Couldn't delete page. Please try again.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const movePage = useMutation({
    mutationFn: async (input: { id: string; parentId: string | null }) => {
      const result = await movePageAction({ organizationId, ...input })
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<PageRecord[]>(queryKey)
      queryClient.setQueryData<PageRecord[]>(queryKey, old =>
        (old ?? []).map(p => p.id === input.id ? { ...p, parentId: input.parentId } : p)
      )
      return { previous }
    },
    onError: (_err, _input, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
      toast.error("Couldn't move page. Please try again.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const updateEmoji = useMutation({
    mutationFn: async (input: { id: string; emoji: string | null }) => {
      const result = await updateEmojiAction({ organizationId, ...input })
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<PageRecord[]>(queryKey)
      queryClient.setQueryData<PageRecord[]>(queryKey, old =>
        (old ?? []).map(p => p.id === input.id ? { ...p, emoji: input.emoji } : p)
      )
      return { previous }
    },
    onError: (_err, _input, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
      toast.error("Couldn't update emoji. Please try again.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return { createPage, renamePage, deletePage, movePage, updateEmoji }
}
