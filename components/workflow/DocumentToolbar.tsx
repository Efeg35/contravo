import { type Editor } from '@tiptap/react'
import {
  Bold,
  Strikethrough,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Underline,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
} from 'lucide-react'
import { Toggle } from '../ui/toggle'

type Props = {
  editor: Editor | null
}

export function DocumentToolbar({ editor }: Props) {
  if (!editor) return null;

  return (
    <div className="flex items-center space-x-1 overflow-x-auto text-gray-600 [&>*:hover]:text-blue-600">
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        className="text-gray-600 hover:text-blue-600"
      >
        <Bold className="w-5 h-5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="w-5 h-5 text-gray-700" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('underline')}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline className="w-5 h-5 text-gray-700" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="w-5 h-5 text-gray-700" />
      </Toggle>
      <span className="border-l border-gray-300 h-5 mx-1" />
      <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="w-5 h-5 text-gray-700" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="w-5 h-5 text-gray-700" />
      </Toggle>
      <span className="border-l border-gray-300 h-5 mx-1" />
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="w-5 h-5 text-gray-700" />
      </Toggle>
      <span className="border-l border-gray-300 h-5 mx-1" />
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'left' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
      >
        <AlignLeft className="w-5 h-5 text-gray-700" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'center' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
      >
        <AlignCenter className="w-5 h-5 text-gray-700" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'right' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
      >
        <AlignRight className="w-5 h-5 text-gray-700" />
      </Toggle>
      <Toggle
        size="sm"
        onPressedChange={() => editor.chain().focus().undo().run()}
      >
        <Undo className="w-5 h-5 text-gray-700" />
      </Toggle>
      <Toggle
        size="sm"
        onPressedChange={() => editor.chain().focus().redo().run()}
      >
        <Redo className="w-5 h-5 text-gray-700" />
      </Toggle>
    </div>
  )
} 