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
    mutationFn: (input: { parentId?: string | null }) => createPageAction(input),
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
    mutationFn: (input: { id: string; title: string }) => renamePageAction(input),
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
    mutationFn: (input: { id: string }) => deletePageAction(input),
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
    mutationFn: (input: { id: string; parentId: string | null }) => movePageAction(input),
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
    mutationFn: (input: { id: string; emoji: string | null }) => updateEmojiAction(input),
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
