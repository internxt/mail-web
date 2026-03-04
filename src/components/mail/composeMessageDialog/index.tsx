import { PaperclipIcon, XIcon } from '@phosphor-icons/react';
import { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import type { Attachment, Recipient } from './types';
import { RecipientInput } from './components/RecipientInput';
import { Button, Input } from '@internxt/ui';
import { RichTextEditor } from './components/RichTextEditor';
import { EditorBar } from './components/editorBar';
import { DefaultAttachmentItem } from './components/DefaultAttachmentItem';

export interface ComposeMessageDialogProps {
  isOpen: boolean
  title: string
  mailValue: string
  subject?: string
  isLoading?: boolean
  primaryActionColor?: string
  attachments?: Attachment[]
  toRecipients?: Recipient[]
  ccRecipients?: Recipient[]
  bccRecipients?: Recipient[]
  text: {
    to: string
    cc: string
    bcc: string
    subject: string
    send: string
  }
  onClose: () => void
  onPrimaryAction: (html: string) => void
  onMailChange?: (html: string) => void
  onSecondaryAction?: () => void
  onRemoveAttachment?: (id: string) => void
  onAddToRecipient?: (email: string) => void
  onRemoveToRecipient?: (id: string) => void
  onAddCcRecipient?: (email: string) => void
  onRemoveCcRecipient?: (id: string) => void
  onAddBccRecipient?: (email: string) => void
  onRemoveBccRecipient?: (id: string) => void
  onSubjectChange?: (value: string) => void
}

export const ComposeMessageDialog = ({
  isOpen,
  title,
  isLoading,
  primaryActionColor = 'primary',
  mailValue,
  attachments = [],
  toRecipients = [],
  ccRecipients = [],
  bccRecipients = [],
  subject = '',
  onClose,
  onMailChange,
  onPrimaryAction,
  onSecondaryAction,
  onRemoveAttachment,
  onAddToRecipient,
  onRemoveToRecipient,
  onAddCcRecipient,
  onRemoveCcRecipient,
  onAddBccRecipient,
  onRemoveBccRecipient,
  onSubjectChange,
  text,
}: ComposeMessageDialogProps) => {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [showCc, setShowCc] = useState(ccRecipients.length > 0);
  const [showBcc, setShowBcc] = useState(bccRecipients.length > 0);

  const handleEditorReady = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance);
  }, []);

  const handlePrimaryAction = useCallback(() => {
    if (editor) {
      const html = editor.getHTML();
      onPrimaryAction(html);
    }
  }, [editor, onPrimaryAction]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={`absolute inset-0 bg-gray-100/50 transition-opacity
     duration-150 dark:bg-black/75
    `}
        role="button"
        onClick={onClose}
        data-testid="dialog-overlay"
      ></div>

      <div
        className={`absolute
      left-1/2
      top-1/2
      w-full
      max-w-[720px]
      -translate-x-1/2
      -translate-y-1/2
      transform rounded-2xl
      bg-surface p-5
      transition-all
      duration-150
      dark:bg-gray-1
      `}
      >
        <div className="flex flex-col space-y-2">
          <div className=" flex flex-row justify-between">
            <p className="text-lg font-medium text-gray-100">{title}</p>
            <XIcon onClick={onClose} className="cursor-pointer" />
          </div>
          <RecipientInput
            label={text.to}
            recipients={toRecipients}
            onAddRecipient={(email) => onAddToRecipient?.(email)}
            onRemoveRecipient={(id) => onRemoveToRecipient?.(id)}
            showCcBcc
            onCcClick={() => setShowCc(true)}
            onBccClick={() => setShowBcc(true)}
            showCcButton={!showCc}
            showBccButton={!showBcc}
            ccButtonText={text.cc}
            bccButtonText={text.bcc}
            disabled={isLoading}
          />
          {showCc && (
            <RecipientInput
              label={text.cc}
              recipients={ccRecipients}
              onAddRecipient={(email) => onAddCcRecipient?.(email)}
              onRemoveRecipient={(id) => onRemoveCcRecipient?.(id)}
              disabled={isLoading}
            />
          )}
          {showBcc && (
            <RecipientInput
              label={text.bcc}
              recipients={bccRecipients}
              onAddRecipient={(email) => onAddBccRecipient?.(email)}
              onRemoveRecipient={(id) => onRemoveBccRecipient?.(id)}
              disabled={isLoading}
            />
          )}
          <div className="flex flex-row gap-2 items-center">
            <p className="font-medium max-w-[64px] w-full text-gray-100">
              {text.subject}
            </p>
            <Input
              className="w-full"
              value={subject}
              onChange={onSubjectChange}
              disabled={isLoading}
            />
          </div>
          <div className="w-full flex border border-gray-5" />
          <EditorBar editor={editor} disabled={isLoading} />
        </div>
        <div className="pt-4">
          <RichTextEditor
            value={mailValue}
            onChange={onMailChange}
            onEditorReady={handleEditorReady}
            className="min-h-[300px]"
            disabled={isLoading}
          />
        </div>
        {attachments.length > 0 && (
          <div className="mt-4 max-h-[100px] space-y-2 overflow-y-auto">
            {attachments.map((attachment) => {
              const handleRemove = () => onRemoveAttachment?.(attachment.id);
              return (
                <DefaultAttachmentItem
                  key={attachment.id}
                  attachment={attachment}
                  onRemove={handleRemove}
                />
              );
            })}
          </div>
        )}
        <div className="mt-5 flex justify-end space-x-2">
          <Button
            variant="ghost"
            onClick={onSecondaryAction}
            disabled={isLoading}
          >
            <PaperclipIcon size={24} />
          </Button>
          <Button
            onClick={handlePrimaryAction}
            loading={isLoading}
            disabled={isLoading}
            variant={
              primaryActionColor === 'primary' ? 'primary' : 'destructive'
            }
          >
            {text.send}
          </Button>
        </div>
      </div>
    </div>
  );
};
