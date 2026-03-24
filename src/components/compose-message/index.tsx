import { PaperclipIcon, XIcon } from '@phosphor-icons/react';
import { useCallback } from 'react';
import type { Recipient } from './types';
import { RecipientInput } from './components/RecipientInput';
import { Button, Input } from '@internxt/ui';
import RichTextEditor from './components/RichTextEditor';
import { EditorBar } from './components/editorBar';
import { ActionDialog, useActionDialog } from '@/context/dialog-manager';
import { useTranslationContext } from '@/i18n';
import useComposeMessage from './hooks/useComposeMessage';
import { useEditor } from '@tiptap/react';
import { EDITOR_CONFIG } from './config';

export interface DraftMessage {
  subject?: string;
  to?: Recipient[];
  cc?: Recipient[];
  bcc?: Recipient[];
  body?: string;
}

export const ComposeMessageDialog = () => {
  const { translate } = useTranslationContext();
  const { closeDialog: onComposeMessageDialogClose, getDialogData: getComposeMessageDialogData } = useActionDialog();

  const draft = (getComposeMessageDialogData(ActionDialog.ComposeMessage) ?? {}) as DraftMessage;
  const {
    showBcc,
    showCc,
    subjectValue,
    toRecipients,
    bccRecipients,
    ccRecipients,
    onAddBccRecipient,
    onAddCcRecipient,
    onRemoveBccRecipient,
    onAddToRecipient,
    onRemoveCcRecipient,
    onRemoveToRecipient,
    onShowBccRecipient,
    onShowCcRecipient,
    onSubjectChange,
  } = useComposeMessage();

  const title = draft.subject ?? translate('modals.composeMessageDialog.title');
  const editor = useEditor(EDITOR_CONFIG);

  const onClose = useCallback(() => {
    onComposeMessageDialogClose(ActionDialog.ComposeMessage);
  }, [onComposeMessageDialogClose]);

  const handlePrimaryAction = useCallback(() => {
    const html = editor?.getHTML();
    console.log('html', html);
    onClose();
  }, [editor, onClose]);

  if (!editor) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        className={`absolute inset-0 bg-gray-100/50 transition-opacity
     duration-150 dark:bg-black/75
    `}
        onClick={onClose}
        data-testid="dialog-overlay"
        aria-label="Close dialog"
      ></button>

      <div
        className={`absolute
      left-1/2
      top-1/2
      w-full
      max-w-180
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
            label={translate('modals.composeMessageDialog.to')}
            recipients={toRecipients}
            onAddRecipient={(email) => onAddToRecipient?.(email)}
            onRemoveRecipient={(id) => onRemoveToRecipient?.(id)}
            showCcBcc
            onCcClick={onShowCcRecipient}
            onBccClick={onShowBccRecipient}
            showCcButton={!showCc}
            showBccButton={!showBcc}
            ccButtonText={translate('modals.composeMessageDialog.cc')}
            bccButtonText={translate('modals.composeMessageDialog.bcc')}
            disabled={false}
          />
          {showCc && (
            <RecipientInput
              label={translate('modals.composeMessageDialog.cc')}
              recipients={ccRecipients}
              onAddRecipient={(email) => onAddCcRecipient?.(email)}
              onRemoveRecipient={(id) => onRemoveCcRecipient?.(id)}
              disabled={false}
            />
          )}
          {showBcc && (
            <RecipientInput
              label={translate('modals.composeMessageDialog.bcc')}
              recipients={bccRecipients}
              onAddRecipient={(email) => onAddBccRecipient?.(email)}
              onRemoveRecipient={(id) => onRemoveBccRecipient?.(id)}
              disabled={false}
            />
          )}
          <div className="flex flex-row gap-2 items-center">
            <p className="font-medium max-w-16 w-full text-gray-100">
              {translate('modals.composeMessageDialog.subject')}
            </p>
            <Input className="w-full" value={subjectValue} onChange={onSubjectChange} disabled={false} />
          </div>
          <div className="w-full flex border border-gray-5" />
          <EditorBar editor={editor} disabled={false} />
        </div>
        <div className="pt-4">
          <RichTextEditor editor={editor} />
        </div>
        {/* !TODO: Handle attachments */}

        <div className="mt-5 flex justify-end space-x-2">
          <Button variant="ghost" onClick={() => {}} disabled={false}>
            <PaperclipIcon size={24} />
          </Button>
          <Button onClick={handlePrimaryAction} loading={false} disabled={false} variant={'primary'}>
            {translate('actions.send')}
          </Button>
        </div>
      </div>
    </div>
  );
};
