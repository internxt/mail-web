import { useCallback, useState, useRef, useEffect, useReducer } from 'react';
import { Editor } from '@tiptap/react';
import { useClickOutside } from '@/hooks/useClickOutside';

export const useEditorBar = (editor: Editor | null) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [currentFont, setCurrentFont] = useState('Arial');
  const [currentSize, setCurrentSize] = useState('14');

  const colorPickerRef = useRef<HTMLDivElement>(null);
  const fontPickerRef = useRef<HTMLDivElement>(null);
  const sizePickerRef = useRef<HTMLDivElement>(null);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    if (!editor) return;

    editor.on('selectionUpdate', forceUpdate);
    editor.on('transaction', forceUpdate);

    return () => {
      editor.off('selectionUpdate', forceUpdate);
      editor.off('transaction', forceUpdate);
    };
  }, [editor]);

  useClickOutside(colorPickerRef, () => setShowColorPicker(false));
  useClickOutside(fontPickerRef, () => setShowFontPicker(false));
  useClickOutside(sizePickerRef, () => setShowSizePicker(false));

  // !TODO: use custom modal to attach a URL
  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = globalThis.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  // !TODO: use custom modal to attach an Image
  const addImage = useCallback(() => {
    if (!editor) return;

    const url = globalThis.prompt('Image URL');

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const setColor = useCallback(
    (color: string) => {
      if (!editor) return;
      editor.chain().focus().setColor(color).run();
      setShowColorPicker(false);
    },
    [editor],
  );

  const setFont = useCallback(
    (font: { label: string; value: string }) => {
      if (!editor) return;
      editor.chain().focus().setFontFamily(font.value).run();
      setCurrentFont(font.label);
      setShowFontPicker(false);
    },
    [editor],
  );

  const setFontSize = useCallback(
    (size: string) => {
      if (!editor) return;
      editor.chain().focus().setFontSize(`${size}px`).run();
      setCurrentSize(size);
      setShowSizePicker(false);
    },
    [editor],
  );

  return {
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
  };
};
