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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Props = {
  editor: Editor | null;
  zoomLevel: number;
  onZoomChange: (zoom: string) => void;
  editorMode: 'tag' | 'edit';
  onEditorModeChange: (mode: 'tag' | 'edit') => void;
}

export function DocumentToolbar({ editor, zoomLevel, onZoomChange, editorMode, onEditorModeChange }: Props) {
  if (!editor) return null;

  return (
    <div className="flex items-center justify-between w-full">
      {/* Sol ve Orta Bölüm */}
      <div className="flex items-center space-x-3">
        {/* Tag/Edit Butonları */}
        <div className="flex rounded-md bg-gray-100 p-0.5">
          <button
            onClick={() => onEditorModeChange('tag')}
            className={`px-3 py-1 text-sm font-semibold rounded transition-colors ${
              editorMode === 'tag'
                ? 'bg-white shadow-sm text-gray-900'
                : 'bg-transparent text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tag
          </button>
          <button
            onClick={() => onEditorModeChange('edit')}
            className={`px-3 py-1 text-sm font-semibold rounded transition-colors ${
              editorMode === 'edit'
                ? 'bg-white shadow-sm text-gray-900'
                : 'bg-transparent text-gray-600 hover:bg-gray-200'
            }`}
          >
            Edit
          </button>
        </div>

        <span className="border-l border-gray-300 h-5" />

        {/* Formatlama Butonları */}
        <div className="flex items-center space-x-1">
          <Toggle
            size="sm"
            pressed={editor.isActive('bold')}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
            className={`text-gray-600 hover:text-[#0070e0] ${editor.isActive('bold') ? 'text-[#0070e0]' : ''}`}
          >
            <Bold className="w-5 h-5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('italic')}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            className={`text-gray-600 hover:text-[#0070e0] ${editor.isActive('italic') ? 'text-[#0070e0]' : ''}`}
          >
            <Italic className="w-5 h-5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('underline')}
            onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
            className={`text-gray-600 hover:text-[#0070e0] ${editor.isActive('underline') ? 'text-[#0070e0]' : ''}`}
          >
            <Underline className="w-5 h-5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('strike')}
            onPressedChange={() => editor.chain().focus().toggleStrike().run()}
            className={`text-gray-600 hover:text-[#0070e0] ${editor.isActive('strike') ? 'text-[#0070e0]' : ''}`}
          >
            <Strikethrough className="w-5 h-5" />
          </Toggle>
          <span className="border-l border-gray-300 h-5 mx-1" />
          <Toggle
            size="sm"
            pressed={editor.isActive('orderedList')}
            onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
            className={`text-gray-600 hover:text-[#0070e0] ${editor.isActive('orderedList') ? 'text-[#0070e0]' : ''}`}
          >
            <ListOrdered className="w-5 h-5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('bulletList')}
            onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
            className={`text-gray-600 hover:text-[#0070e0] ${editor.isActive('bulletList') ? 'text-[#0070e0]' : ''}`}
          >
            <List className="w-5 h-5" />
          </Toggle>
          <span className="border-l border-gray-300 h-5 mx-1" />
          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 2 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`text-gray-600 hover:text-[#0070e0] ${editor.isActive('heading', { level: 2 }) ? 'text-[#0070e0]' : ''}`}
          >
            <Heading2 className="w-5 h-5" />
          </Toggle>
          <span className="border-l border-gray-300 h-5 mx-1" />
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: 'left' })}
            onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
            className={`text-gray-600 hover:text-[#0070e0] ${editor.isActive({ textAlign: 'left' }) ? 'text-[#0070e0]' : ''}`}
          >
            <AlignLeft className="w-5 h-5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: 'center' })}
            onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
            className={`text-gray-600 hover:text-[#0070e0] ${editor.isActive({ textAlign: 'center' }) ? 'text-[#0070e0]' : ''}`}
          >
            <AlignCenter className="w-5 h-5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: 'right' })}
            onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
            className={`text-gray-600 hover:text-[#0070e0] ${editor.isActive({ textAlign: 'right' }) ? 'text-[#0070e0]' : ''}`}
          >
            <AlignRight className="w-5 h-5" />
          </Toggle>
          <Toggle
            size="sm"
            onPressedChange={() => editor.chain().focus().undo().run()}
            className="text-gray-600 hover:text-[#0070e0]"
          >
            <Undo className="w-5 h-5" />
          </Toggle>
          <Toggle
            size="sm"
            onPressedChange={() => editor.chain().focus().redo().run()}
            className="text-gray-600 hover:text-[#0070e0]"
          >
            <Redo className="w-5 h-5" />
          </Toggle>
        </div>
      </div>

      {/* Sağ Bölüm (Zoom) */}
      <div className="flex items-center space-x-2">
        <Select onValueChange={onZoomChange} defaultValue={zoomLevel.toString()}>
          <SelectTrigger className="w-[90px] h-8 text-xs">
            <SelectValue placeholder="Zoom" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="50">50%</SelectItem>
            <SelectItem value="75">75%</SelectItem>
            <SelectItem value="100">100%</SelectItem>
            <SelectItem value="125">125%</SelectItem>
            <SelectItem value="150">150%</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}