import { Extension } from '@tiptap/core'
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion'

export interface SlashCommandItem {
  title: string
  aliases: string[]
  icon: string // lucide icon name as string, resolved in SlashCommandList
  command: (params: { editor: any; range: any }) => void
}

export const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    title: 'Text',
    aliases: ['text', 'paragraph', 'p'],
    icon: 'Type',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('paragraph').run(),
  },
  {
    title: 'Heading 1',
    aliases: ['h1', 'heading1'],
    icon: 'Heading1',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    aliases: ['h2', 'heading2'],
    icon: 'Heading2',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    aliases: ['h3', 'heading3'],
    icon: 'Heading3',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run(),
  },
  {
    title: 'Bullet list',
    aliases: ['ul', 'list', 'bullet'],
    icon: 'List',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: 'Numbered list',
    aliases: ['ol', 'numbered'],
    icon: 'ListOrdered',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: 'To-do list',
    aliases: ['todo', 'task', 'check'],
    icon: 'ListTodo',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    title: 'Code block',
    aliases: ['code', 'codeblock'],
    icon: 'Code2',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: 'Quote',
    aliases: ['quote', 'blockquote'],
    icon: 'Quote',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: 'Divider',
    aliases: ['hr', 'divider', 'rule'],
    icon: 'Minus',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    title: 'Image',
    aliases: ['img', 'image', 'photo'],
    icon: 'Image',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run()
      editor.view.dom.dispatchEvent(new CustomEvent('tiptap:image-insert', { bubbles: true }))
    },
  },
]

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: { editor: any; range: any; props: any }) => {
          props.command({ editor, range })
        },
      } as Partial<SuggestionOptions>,
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
