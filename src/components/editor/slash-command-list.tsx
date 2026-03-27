'use client'

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Code2,
  Quote,
  Minus,
  Image as ImageIcon,
} from 'lucide-react'
import type { SlashCommandItem } from './slash-command'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Code2,
  Quote,
  Minus,
  Image: ImageIcon,
}

export interface SlashCommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

interface SlashCommandListProps {
  items: SlashCommandItem[]
  command: (item: SlashCommandItem) => void
}

export const SlashCommandList = forwardRef<SlashCommandListRef, SlashCommandListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedIndex(0)
    }, [items])

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index]
        if (item) command(item)
      },
      [items, command],
    )

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length)
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((prev) => (prev + 1) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          selectItem(selectedIndex)
          return true
        }
        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div className="z-50 overflow-hidden rounded-md border border-border bg-popover p-2 shadow-md">
          <p className="text-sm text-muted-foreground">
            No matching blocks — keep typing or press Escape
          </p>
        </div>
      )
    }

    return (
      <div className="z-50 overflow-hidden rounded-md border border-border bg-popover shadow-md">
        {items.map((item, index) => {
          const Icon = ICON_MAP[item.icon]
          return (
            <button
              key={item.title}
              type="button"
              className={`flex w-full items-center gap-2 px-2 text-sm h-9 ${
                index === selectedIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'text-popover-foreground hover:bg-accent/50'
              }`}
              onClick={() => selectItem(index)}
              role="option"
              aria-selected={index === selectedIndex}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
              <span>{item.title}</span>
            </button>
          )
        })}
      </div>
    )
  },
)

SlashCommandList.displayName = 'SlashCommandList'
