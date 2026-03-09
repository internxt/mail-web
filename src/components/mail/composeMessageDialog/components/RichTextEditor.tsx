import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { useEffect } from 'react';
import { FontSize } from './fontSizeExtension';

export interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  onEditorReady?: (editor: Editor) => void;
  className?: string;
  disabled?: boolean;
}

export const RichTextEditor = ({
  value = '',
  onChange,
  onEditorReady,
  className = '',
  disabled,
}: RichTextEditorProps) => {
  const editor = useEditor({
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: true,
          HTMLAttributes: {
            class: 'list-disc ml-4',
          },
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: true,
          HTMLAttributes: {
            class: 'list-decimal ml-4',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'ml-2',
          },
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `focus:outline-none h-full ${className}`,
      },
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData('text/plain');
        const { from, to } = view.state.selection;
        const hasSelection = from !== to;

        if (text && hasSelection) {
          const urlPattern = /^(https?:\/\/|www\.)[^\s]+$/i;
          if (urlPattern.test(text)) {
            const url = text.startsWith('www.') ? `https://${text}` : text;
            view.dispatch(view.state.tr.addMark(from, to, view.state.schema.marks.link.create({ href: url })));
            return true;
          }
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  if (!editor) {
    return null;
  }

  return (
    <div className="h-[300px] overflow-y-auto">
      <EditorContent editor={editor} className="h-full" />
    </div>
  );
};

export type { Editor };
