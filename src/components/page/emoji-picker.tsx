'use client'

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import { EmojiPicker } from 'frimousse'

interface EmojiPickerPopoverProps {
  emoji: string | null
  onEmojiSelect: (emoji: string | null) => void
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
          onEmojiSelect={({ emoji: selectedEmoji }) => {
            onEmojiSelect(selectedEmoji)
            setOpen(false)
          }}
        >
          <EmojiPicker.Search />
          <EmojiPicker.Viewport>
            <EmojiPicker.Loading>Loading...</EmojiPicker.Loading>
            <EmojiPicker.List />
          </EmojiPicker.Viewport>
        </EmojiPicker.Root>
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
      </PopoverContent>
    </Popover>
  )
}
