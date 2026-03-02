import {
  TextBIcon,
  TextItalicIcon,
  TextUnderlineIcon,
  TextStrikethroughIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  TextAlignLeftIcon,
  TextAlignCenterIcon,
  TextAlignRightIcon,
  LinkIcon,
  EraserIcon,
  ImageIcon,
  CaretDownIcon,
  PaintBucketIcon,
} from '@phosphor-icons/react'
import { Editor } from '@tiptap/react'
import { useCallback, useState, useRef, useEffect, useReducer } from 'react'
import { EditorBarButton } from './EditorBarButton'
import { EditorBarGroup } from './EditorBarGroup'
import type { EditorBarItem } from '../../types'

export interface ActionBarProps {
  editor: Editor | null
  disabled?: boolean
}

const FONTS = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: 'Times New Roman, serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Courier New', value: 'Courier New, monospace' },
]

const FONT_SIZES = ['10', '12', '14', '16', '18', '20', '24', '28', '32']

const COLORS = [
  '#000000',
  '#434343',
  '#666666',
  '#999999',
  '#CCCCCC',
  '#EFEFEF',
  '#F3F3F3',
  '#FFFFFF',
  '#FF0000',
  '#FF9900',
  '#FFFF00',
  '#00FF00',
  '#00FFFF',
  '#0000FF',
  '#9900FF',
  '#FF00FF',
]

export const EditorBar = ({ editor, disabled }: ActionBarProps) => {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showFontPicker, setShowFontPicker] = useState(false)
  const [showSizePicker, setShowSizePicker] = useState(false)
  const [currentFont, setCurrentFont] = useState('Arial')
  const [currentSize, setCurrentSize] = useState('14')

  const colorPickerRef = useRef<HTMLDivElement>(null)
  const fontPickerRef = useRef<HTMLDivElement>(null)
  const sizePickerRef = useRef<HTMLDivElement>(null)
  const [, forceUpdate] = useReducer((x) => x + 1, 0)

  useEffect(() => {
    if (!editor) return

    editor.on('selectionUpdate', forceUpdate)
    editor.on('transaction', forceUpdate)

    return () => {
      editor.off('selectionUpdate', forceUpdate)
      editor.off('transaction', forceUpdate)
    }
  }, [editor])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setShowColorPicker(false)
      }
      if (
        fontPickerRef.current &&
        !fontPickerRef.current.contains(event.target as Node)
      ) {
        setShowFontPicker(false)
      }
      if (
        sizePickerRef.current &&
        !sizePickerRef.current.contains(event.target as Node)
      ) {
        setShowSizePicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // TODO: Update this to use the Modal component instead
  const setLink = useCallback(() => {
    if (!editor) return

    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) return

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  // TODO: Update this to use the Modal component instead
  const addImage = useCallback(() => {
    if (!editor) return

    const url = window.prompt('Image URL')

    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const setColor = useCallback(
    (color: string) => {
      if (!editor) return
      editor.chain().focus().setColor(color).run()
      setShowColorPicker(false)
    },
    [editor],
  )

  const setFont = useCallback(
    (font: { label: string; value: string }) => {
      if (!editor) return
      editor.chain().focus().setFontFamily(font.value).run()
      setCurrentFont(font.label)
      setShowFontPicker(false)
    },
    [editor],
  )

  const setFontSize = useCallback(
    (size: string) => {
      if (!editor) return
      editor.chain().focus().setFontSize(`${size}px`).run()
      setCurrentSize(size)
      setShowSizePicker(false)
    },
    [editor],
  )

  if (!editor) {
    return null
  }

  return (
    <div className="flex w-full flex-row flex-wrap items-center gap-1.5 rounded-lg border border-gray-10 bg-gray-1 p-1">
      {/* Font selector */}
      <div ref={fontPickerRef} className="relative">
        <button
          type="button"
          onClick={() => setShowFontPicker(!showFontPicker)}
          disabled={disabled}
          className={`flex items-center gap-1 px-2 py-1 text-sm text-gray-60 hover:bg-gray-5 rounded ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="w-16 truncate text-left">{currentFont}</span>
          <CaretDownIcon size={12} />
        </button>
        {showFontPicker && (
          <div
            className="absolute top-full w-full left-0 mt-1 py-1 bg-surface border border-gray-10
              rounded-lg shadow-lg z-20 min-w-[150px]"
          >
            {FONTS.map((font) => (
              <button
                key={font.value}
                type="button"
                onClick={() => setFont(font)}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-5 text-gray-80"
                style={{ fontFamily: font.value }}
              >
                {font.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="w-px h-5 bg-gray-10" />
      {/* Size selector */}
      <div ref={sizePickerRef} className="relative">
        <button
          type="button"
          onClick={() => setShowSizePicker(!showSizePicker)}
          disabled={disabled}
          className={`flex items-center gap-1 px-2 py-1 text-sm text-gray-60 hover:bg-gray-5 rounded ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="w-6 text-center">{currentSize}</span>
          <CaretDownIcon size={12} />
        </button>
        {showSizePicker && (
          <div
            className="absolute top-full left-0 mt-1 py-1 bg-surface border border-gray-10
              rounded-lg shadow-lg z-20 max-h-[200px] overflow-y-auto"
          >
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setFontSize(size)}
                className="w-full px-4 py-1.5 text-left text-sm hover:bg-gray-5 text-gray-80"
              >
                {size}px
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="w-px h-5 bg-gray-10" />
      {/* Color picker */}
      <div ref={colorPickerRef} className="relative">
        <EditorBarButton
          onClick={() => setShowColorPicker(!showColorPicker)}
          disabled={disabled}
        >
          <PaintBucketIcon size={20} />
        </EditorBarButton>
        {showColorPicker && (
          <div
            className="absolute top-full left-0 mt-1 p-3 bg-surface border border-gray-10
              rounded-lg shadow-lg z-20"
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: '8px',
              }}
            >
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setColor(color)}
                  style={{
                    backgroundColor: color,
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    border: '1px solid #d1d1d7',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="w-px h-5 bg-gray-10" />
      {/* Text styles */}
      <EditorBarGroup
        disabled={disabled}
        items={
          [
            {
              id: 'bold',
              icon: TextBIcon,
              onClick: () => editor.chain().focus().toggleBold().run(),
              isActive: editor.isActive('bold'),
            },
            {
              id: 'italic',
              icon: TextItalicIcon,
              onClick: () => editor.chain().focus().toggleItalic().run(),
              isActive: editor.isActive('italic'),
            },
            {
              id: 'underline',
              icon: TextUnderlineIcon,
              onClick: () => editor.chain().focus().toggleUnderline().run(),
              isActive: editor.isActive('underline'),
            },
            {
              id: 'strike',
              icon: TextStrikethroughIcon,
              onClick: () => editor.chain().focus().toggleStrike().run(),
              isActive: editor.isActive('strike'),
            },
          ] satisfies EditorBarItem[]
        }
      />
      <div className="w-px h-5 bg-gray-10" />
      {/* Lists */}
      <EditorBarGroup
        disabled={disabled}
        items={
          [
            {
              id: 'bulletList',
              icon: ListBulletsIcon,
              onClick: () => editor.chain().focus().toggleBulletList().run(),
              isActive: editor.isActive('bulletList'),
            },
            {
              id: 'orderedList',
              icon: ListNumbersIcon,
              onClick: () => editor.chain().focus().toggleOrderedList().run(),
              isActive: editor.isActive('orderedList'),
            },
          ] satisfies EditorBarItem[]
        }
      />
      <div className="w-px h-5 bg-gray-10" />
      {/* Text alignment */}
      <EditorBarGroup
        disabled={disabled}
        items={
          [
            {
              id: 'alignLeft',
              icon: TextAlignLeftIcon,
              onClick: () => editor.chain().focus().setTextAlign('left').run(),
              isActive: editor.isActive({ textAlign: 'left' }),
            },
            {
              id: 'alignCenter',
              icon: TextAlignCenterIcon,
              onClick: () =>
                editor.chain().focus().setTextAlign('center').run(),
              isActive: editor.isActive({ textAlign: 'center' }),
            },
            {
              id: 'alignRight',
              icon: TextAlignRightIcon,
              onClick: () => editor.chain().focus().setTextAlign('right').run(),
              isActive: editor.isActive({ textAlign: 'right' }),
            },
          ] satisfies EditorBarItem[]
        }
      />
      <div className="w-px h-5 bg-gray-10" />
      {/* Link, clear, image */}
      <EditorBarGroup
        disabled={disabled}
        items={
          [
            {
              id: 'link',
              icon: LinkIcon,
              onClick: setLink,
              isActive: editor.isActive('link'),
            },
            {
              id: 'clear',
              icon: EraserIcon,
              onClick: () =>
                editor.chain().focus().unsetAllMarks().clearNodes().run(),
            },
          ] satisfies EditorBarItem[]
        }
      />
      <div className="w-px h-5 bg-gray-10" />
      {/* Image */}
      <EditorBarButton onClick={addImage} disabled={disabled}>
        <ImageIcon size={20} />
      </EditorBarButton>
    </div>
  )
}
