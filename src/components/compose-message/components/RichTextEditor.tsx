import { EditorContent, Editor } from '@tiptap/react';

export interface RichTextEditorProps {
  editor: Editor;
}

const RichTextEditor = ({ editor }: RichTextEditorProps) => {
  return (
    <div className="h-75 overflow-y-auto">
      <EditorContent editor={editor} className="h-full" />
    </div>
  );
};

export default RichTextEditor;
