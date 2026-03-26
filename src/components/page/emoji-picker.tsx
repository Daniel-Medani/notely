'use client'

import { useState } from 'react'
import {
  type EmojiPickerListCategoryHeaderProps,
  type EmojiPickerListEmojiProps,
  type EmojiPickerListRowProps,
  EmojiPicker,
} from 'frimousse'
import { LoaderIcon, SearchIcon, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

interface EmojiPickerPopoverProps {
  emoji: string | null
  onEmojiSelect: (emoji: string | null) => void
}

function EmojiRow({ children, ...props }: EmojiPickerListRowProps) {
  return (
    <div {...props} className="scroll-my-1 px-1">
      {children}
    </div>
  )
}

function EmojiItem({ emoji, className, ...props }: EmojiPickerListEmojiProps) {
  return (
    <button
      {...props}
      className={cn(
        'data-[active]:bg-accent flex size-7 items-center justify-center rounded-sm text-base',
        className,
      )}
    >
      {emoji.emoji}
    </button>
  )
}

function EmojiCategoryHeader({ category, ...props }: EmojiPickerListCategoryHeaderProps) {
  return (
    <div
      {...props}
      className="bg-popover text-muted-foreground px-3 pb-2 pt-3.5 text-xs leading-none"
    >
      {category.label}
    </div>
  )
}

export function EmojiPickerPopover({ emoji, onEmojiSelect }: EmojiPickerPopoverProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-lg"
          aria-label="Change page emoji"
        >
          {emoji ? (
            <span className="text-base">{emoji}</span>
          ) : (
            <FileText className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-0" align="start">
        <EmojiPicker.Root
          className="bg-popover text-popover-foreground isolate flex w-fit flex-col overflow-hidden rounded-md"
          onEmojiSelect={({ emoji: selectedEmoji }) => {
            onEmojiSelect(selectedEmoji)
            setOpen(false)
          }}
        >
          {/* Search */}
          <div className="flex h-9 items-center gap-2 border-b px-3">
            <SearchIcon className="size-4 shrink-0 opacity-50" />
            <EmojiPicker.Search
              className="outline-hidden placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search emoji…"
            />
          </div>

          {/* Scrollable emoji grid */}
          <EmojiPicker.Viewport className="outline-hidden relative h-[180px] overflow-y-auto">
            <EmojiPicker.Loading className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <LoaderIcon className="size-4 animate-spin" />
            </EmojiPicker.Loading>
            <EmojiPicker.Empty className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              No emoji found.
            </EmojiPicker.Empty>
            <EmojiPicker.List
              className="select-none pb-1"
              components={{
                Row: EmojiRow,
                Emoji: EmojiItem,
                CategoryHeader: EmojiCategoryHeader,
              }}
            />
          </EmojiPicker.Viewport>

          {/* Remove emoji footer */}
          {emoji && (
            <div className="border-t p-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground"
                onClick={() => {
                  onEmojiSelect(null)
                  setOpen(false)
                }}
              >
                Remove emoji
              </Button>
            </div>
          )}
        </EmojiPicker.Root>
      </PopoverContent>
    </Popover>
  )
}
