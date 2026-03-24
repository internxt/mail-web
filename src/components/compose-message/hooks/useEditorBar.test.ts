import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useEditorBar } from './useEditorBar';
import type { Editor } from '@tiptap/react';

const createMockEditor = (): Editor => {
  const chainMock = {
    focus: vi.fn().mockReturnThis(),
    setColor: vi.fn().mockReturnThis(),
    setFontFamily: vi.fn().mockReturnThis(),
    setFontSize: vi.fn().mockReturnThis(),
    setImage: vi.fn().mockReturnThis(),
    setLink: vi.fn().mockReturnThis(),
    unsetLink: vi.fn().mockReturnThis(),
    extendMarkRange: vi.fn().mockReturnThis(),
    run: vi.fn(),
  };

  return {
    on: vi.fn(),
    off: vi.fn(),
    getAttributes: vi.fn().mockReturnValue({ href: '' }),
    chain: vi.fn().mockReturnValue(chainMock),
  } as unknown as Editor;
};

describe('Editor bar - custom hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial state', () => {
    test('When initialized, then all pickers should be hidden and defaults set', () => {
      const { result } = renderHook(() => useEditorBar(null));

      expect(result.current.showColorPicker).toBeFalsy();
      expect(result.current.showFontPicker).toBeFalsy();
      expect(result.current.showSizePicker).toBeFalsy();
      expect(result.current.currentFont).toBe('Arial');
      expect(result.current.currentSize).toBe('14');
    });
  });

  describe('Editor event listeners', () => {
    test('When editor is provided, then it should register editor listeners', () => {
      const editor = createMockEditor();

      renderHook(() => useEditorBar(editor));

      expect(editor.on).toHaveBeenCalledWith('selectionUpdate', expect.any(Function));
      expect(editor.on).toHaveBeenCalledWith('transaction', expect.any(Function));
    });

    test('When the hook unmounts, then it should unregister editor listeners', () => {
      const editor = createMockEditor();

      const { unmount } = renderHook(() => useEditorBar(editor));

      unmount();

      expect(editor.off).toHaveBeenCalledWith('selectionUpdate', expect.any(Function));
      expect(editor.off).toHaveBeenCalledWith('transaction', expect.any(Function));
    });

    test('When editor is null, then it should not register listeners', () => {
      const editor = createMockEditor();

      renderHook(() => useEditorBar(null));

      expect(editor.on).not.toHaveBeenCalled();
    });
  });

  describe('Picker visibility toggles', () => {
    test('When opening the color picker, then it should return so', () => {
      const { result } = renderHook(() => useEditorBar(null));

      act(() => result.current.setShowColorPicker(true));

      expect(result.current.showColorPicker).toBe(true);
    });

    test('When opening the font picker, then it should return so', () => {
      const { result } = renderHook(() => useEditorBar(null));

      act(() => result.current.setShowFontPicker(true));

      expect(result.current.showFontPicker).toBe(true);
    });

    test('When opening the size picker, then it should return so', () => {
      const { result } = renderHook(() => useEditorBar(null));

      act(() => result.current.setShowSizePicker(true));

      expect(result.current.showSizePicker).toBe(true);
    });
  });

  describe('Click outside', () => {
    test('When the hook mounts, then it should register a mousedown listener on document', () => {
      const addSpy = vi.spyOn(document, 'addEventListener');

      renderHook(() => useEditorBar(null));

      expect(addSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    });

    test('When the hook unmounts, then it should remove the mousedown listener from document', () => {
      const removeSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = renderHook(() => useEditorBar(null));
      unmount();

      expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    });
  });

  describe('Color picker', () => {
    test('When a color is selected, then it should apply it and hide the picker', () => {
      const editor = createMockEditor();
      const { result } = renderHook(() => useEditorBar(editor));

      act(() => result.current.setShowColorPicker(true));
      act(() => result.current.setColor('#ff0000'));

      expect(editor.chain).toHaveBeenCalled();
      expect(result.current.showColorPicker).toBeFalsy();
    });

    test('When there is no editor, then it should do nothing', () => {
      const editor = createMockEditor();
      const { result } = renderHook(() => useEditorBar(null));

      act(() => result.current.setColor('#ff0000'));

      expect(editor.chain).not.toHaveBeenCalled();
    });
  });

  describe('Text Font', () => {
    test('When applying a font, then it should apply it and hide the picker', () => {
      const editor = createMockEditor();
      const { result } = renderHook(() => useEditorBar(editor));

      act(() => result.current.setShowFontPicker(true));
      act(() => result.current.setFont({ label: 'Times New Roman', value: 'Times New Roman' }));

      expect(editor.chain).toHaveBeenCalled();
      expect(result.current.currentFont).toBe('Times New Roman');
      expect(result.current.showFontPicker).toBeFalsy();
    });

    test('When there is no editor, then it should do nothing', () => {
      const editor = createMockEditor();
      const { result } = renderHook(() => useEditorBar(null));

      act(() => result.current.setFont({ label: 'Georgia', value: 'Georgia' }));

      expect(editor.chain).not.toHaveBeenCalled();
      expect(result.current.currentFont).toBe('Arial');
    });
  });

  describe('Font size', () => {
    test('When applying a font size, then it should apply it and hide the picker', () => {
      const editor = createMockEditor();
      const { result } = renderHook(() => useEditorBar(editor));

      act(() => result.current.setShowSizePicker(true));
      act(() => result.current.setFontSize('18'));

      expect(editor.chain).toHaveBeenCalled();
      expect(result.current.currentSize).toBe('18');
      expect(result.current.showSizePicker).toBeFalsy();
    });

    test('When there is no editor, then it should do nothing', () => {
      const editor = createMockEditor();
      const { result } = renderHook(() => useEditorBar(null));

      act(() => result.current.setFontSize('20'));

      expect(editor.chain).not.toHaveBeenCalled();
      expect(result.current.currentSize).toBe('14');
    });
  });

  describe('Adding a link', () => {
    test('When adding a link, then it should open a prompt', () => {
      const editor = createMockEditor();
      vi.spyOn(globalThis, 'prompt').mockReturnValue('https://example.com');

      const { result } = renderHook(() => useEditorBar(editor));

      act(() => result.current.setLink());

      expect(editor.chain).toHaveBeenCalled();
    });

    test('when there is no editor, then it should do nothing', () => {
      vi.spyOn(globalThis, 'prompt').mockReturnValue('https://example.com');

      const { result } = renderHook(() => useEditorBar(null));

      act(() => result.current.setLink());

      expect(globalThis.prompt).not.toHaveBeenCalled();
    });
  });

  describe('Adding an image', () => {
    test('When adding an image, then it should open a prompt and call editor chain', () => {
      const editor = createMockEditor();
      vi.spyOn(globalThis, 'prompt').mockReturnValue('https://example.com/image.png');

      const { result } = renderHook(() => useEditorBar(editor));

      act(() => result.current.addImage());

      expect(editor.chain).toHaveBeenCalled();
    });

    test('when the image URL is empty, then it should do nothing', () => {
      const editor = createMockEditor();
      vi.spyOn(globalThis, 'prompt').mockReturnValue('');
      const chainSpy = vi.spyOn(editor, 'chain');

      const { result } = renderHook(() => useEditorBar(editor));

      act(() => result.current.addImage());

      expect(chainSpy).not.toHaveBeenCalled();
    });

    test('when there is no editor, then it should do nothing', () => {
      vi.spyOn(globalThis, 'prompt').mockReturnValue('https://example.com/image.png');

      const { result } = renderHook(() => useEditorBar(null));

      act(() => result.current.addImage());

      expect(globalThis.prompt).not.toHaveBeenCalled();
    });
  });
});
