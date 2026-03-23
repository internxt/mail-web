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
} from '@phosphor-icons/react';
import { Editor } from '@tiptap/react';
import { EditorBarButton } from './EditorBarButton';
import { EditorBarGroup } from './EditorBarGroup';
import type { EditorBarItem } from '../../types';
import { COLORS, FONT_SIZES, FONTS } from './config';
import { useEditorBar } from '../../hooks/useEditorBar';
import { Activity } from 'react';

export interface ActionBarProps {
  editor: Editor;
  disabled?: boolean;
}

export const EditorBar = ({ editor, disabled }: ActionBarProps) => {
  const {
    showColorPicker,
    showFontPicker,
    showSizePicker,
    currentFont,
    currentSize,
    colorPickerRef,
    fontPickerRef,
    sizePickerRef,
    setShowColorPicker,
    setShowFontPicker,
    setShowSizePicker,
    setLink,
    addImage,
    setColor,
    setFont,
    setFontSize,
  } = useEditorBar(editor);

  const textStyles = [
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
  ] satisfies EditorBarItem[];

  const textList = [
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
  ] satisfies EditorBarItem[];

  const textAligment = [
    {
      id: 'alignLeft',
      icon: TextAlignLeftIcon,
      onClick: () => editor.chain().focus().setTextAlign('left').run(),
      isActive: editor.isActive({ textAlign: 'left' }),
    },
    {
      id: 'alignCenter',
      icon: TextAlignCenterIcon,
      onClick: () => editor.chain().focus().setTextAlign('center').run(),
      isActive: editor.isActive({ textAlign: 'center' }),
    },
    {
      id: 'alignRight',
      icon: TextAlignRightIcon,
      onClick: () => editor.chain().focus().setTextAlign('right').run(),
      isActive: editor.isActive({ textAlign: 'right' }),
    },
  ] satisfies EditorBarItem[];

  const messageAttachment = [
    {
      id: 'link',
      icon: LinkIcon,
      onClick: setLink,
      isActive: editor.isActive('link'),
    },
    {
      id: 'clear',
      icon: EraserIcon,
      onClick: () => editor.chain().focus().unsetAllMarks().clearNodes().run(),
    },
  ] satisfies EditorBarItem[];

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
        <Activity mode={showFontPicker ? 'visible' : 'hidden'}>
          <div
            className="absolute top-full w-full left-0 mt-1 py-1 bg-surface border border-gray-10
              rounded-lg shadow-lg z-20 min-w-37.5"
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
        </Activity>
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
        <Activity mode={showSizePicker ? 'visible' : 'hidden'}>
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
        </Activity>
      </div>
      <div className="w-px h-5 bg-gray-10" />
      {/* Color picker */}
      <div ref={colorPickerRef} className="relative">
        <EditorBarButton onClick={() => setShowColorPicker(!showColorPicker)} disabled={disabled}>
          <PaintBucketIcon size={20} />
        </EditorBarButton>
        <Activity mode={showColorPicker ? 'visible' : 'hidden'}>
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
        </Activity>
      </div>
      <div className="w-px h-5 bg-gray-10" />
      {/* Text styles */}
      <EditorBarGroup disabled={disabled} items={textStyles} />
      <div className="w-px h-5 bg-gray-10" />
      {/* Lists */}
      <EditorBarGroup disabled={disabled} items={textList} />
      <div className="w-px h-5 bg-gray-10" />
      {/* Text alignment */}
      <EditorBarGroup disabled={disabled} items={textAligment} />
      <div className="w-px h-5 bg-gray-10" />
      {/* Link, clear, image */}
      <EditorBarGroup disabled={disabled} items={messageAttachment} />
      <div className="w-px h-5 bg-gray-10" />
      {/* Image */}
      <EditorBarButton onClick={addImage} disabled={disabled}>
        <ImageIcon size={20} />
      </EditorBarButton>
    </div>
  );
};
