import { LockKeyIcon, PaperclipIcon, TrashIcon, WarningIcon, XIcon } from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';

import { genSymmetricKey } from 'internxt-crypto';
import type { Recipient } from './types';
import { RecipientInput } from './components/RecipientInput';
import { AttachmentList } from './components/AttachmentList';
import { Button, Input } from '@internxt/ui';
import RichTextEditor from './components/RichTextEditor';
import { EditorBar } from './components/editorBar';
import { ActionDialog, useActionDialog } from '@/context/dialog-manager';
import { useTranslationContext } from '@/i18n';
import useComposeMessage from './hooks/useComposeMessage';
import useAttachments from './hooks/useAttachments';
import { useEditor } from '@tiptap/react';
import { EDITOR_CONFIG } from './config';
import useComposeSend from './hooks/useComposeSend';
import type { ComposePayload } from '@/types/mail';
import { useInitialComposeState } from './hooks/useInitialComposeState';
import { useDraftMessage } from './hooks/useDraftMessage';
import { MailEncryptionService } from '@/services/mail-encryption';
import { MailKeysService } from '@/services/mail-keys';
import type { EncryptionBlock } from '@internxt/sdk/dist/mail/types';
import { ErrorService } from '@/services/error';
import dayjs from 'dayjs';

const formatDraftSavedAt = (iso: string): string => {
  const d = dayjs(iso);
  return d.isSame(dayjs(), 'day') ? d.format('HH:mm') : d.format('DD MMM');
};

export interface DraftMessage {
  subject?: string;
  to?: Recipient[];
  cc?: Recipient[];
  bcc?: Recipient[];
  body?: string;
}

const ALLOWED_MODES_TO_FILL_BODY = new Set(['draft', 'forward']);

export const ComposeMessageDialog = () => {
  const { translate } = useTranslationContext();
  const { closeDialog: onComposeMessageDialogClose, getDialogData: getComposeMessageDialogData } = useActionDialog();
  const composeDialogData = getComposeMessageDialogData(ActionDialog.ComposeMessage) as ComposePayload | undefined;

  const { data: item, mode } = useInitialComposeState(composeDialogData);
  const isNewMode = mode === 'new';
  const isReplyMode = mode === 'reply';
  const isReplyAllMode = mode === 'replyAll';
  const isDraftMode = mode === 'draft';
  const inReplyItemId = isReplyMode || isReplyAllMode ? item.replyToEmailId : undefined;
  const initialDraftId = isDraftMode ? item.draftId : undefined;
  const initialReceivedAtDraft = isDraftMode ? item.receivedAt : undefined;

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
    setInitialValues,
    clear: clearComposeMessage,
  } = useComposeMessage();

  const title = item.subject ?? translate('modals.composeMessageDialog.title');
  const editor = useEditor(EDITOR_CONFIG);

  useEffect(() => {
    setInitialValues(item);
  }, [item, mode]);

  useEffect(() => {
    if (!ALLOWED_MODES_TO_FILL_BODY.has(mode) || !editor || !item.htmlBody) return;
    const content = isDraftMode ? item.htmlBody : '<p></p><p></p>' + item.htmlBody;
    editor.commands.setContent(content);
    editor.commands.focus('start');
  }, [editor, mode, item.htmlBody]);

  const [attachmentsSessionKey, setAttachmentsSessionKey] = useState<Uint8Array>(() => genSymmetricKey());
  const sessionKeyHydratedRef = useRef(false);

  const {
    attachments,
    totalSize: attachmentsTotalSize,
    isUploading: isUploadingAttachments,
    hasErrors: hasAttachmentErrors,
    addFiles: addAttachmentFiles,
    addInheritedAttachments,
    addPersistedAttachments,
    retry: retryAttachment,
    remove: removeAttachment,
    clear: clearAttachments,
  } = useAttachments(attachmentsSessionKey);

  const hydratedForwardAttachmentsRef = useRef(false);
  useEffect(() => {
    if (mode !== 'forward') return;
    if (hydratedForwardAttachmentsRef.current) return;

    const inherited = item.inheritedAttachments ?? [];
    if (inherited.length === 0) return;

    hydratedForwardAttachmentsRef.current = true;
    addInheritedAttachments(inherited);
  }, [mode, item.inheritedAttachments, addInheritedAttachments]);

  const hydratedPersistedAttachmentsRef = useRef(false);
  useEffect(() => {
    if (mode !== 'draft' || hydratedPersistedAttachmentsRef.current) return;
    const persisted = item.persistedAttachments ?? [];
    if (persisted.length === 0) return;
    hydratedPersistedAttachmentsRef.current = true;
    addPersistedAttachments(persisted);
  }, [mode, item.persistedAttachments, addPersistedAttachments]);

  useEffect(() => {
    if (mode !== 'draft' || sessionKeyHydratedRef.current) return;
    const envelope = composeDialogData?.mode === 'draft' ? composeDialogData.draft.encryption : undefined;
    if (!envelope) return;
    const keys = MailKeysService.instance.getCurrentKeys();
    const address = MailKeysService.instance.getCurrentAddress();
    if (!keys || !address) return;
    MailEncryptionService.instance
      .decryptAttachmentsSessionKey(envelope as EncryptionBlock, keys, address)
      .then((key) => {
        setAttachmentsSessionKey(key);
        sessionKeyHydratedRef.current = true;
      })
      .catch((e) => {
        console.error('Failed to recover draft session key', e);
        sessionKeyHydratedRef.current = false;
      });
  }, [mode, composeDialogData]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { saveDraft, resolveDraftId, handleDraftDiscard, isDiscarding, draftSavedAt, clearDraftRef } = useDraftMessage({
    existentDraftId: initialDraftId,
    draftReceivedAt: initialReceivedAtDraft,
    isDraftActive: isNewMode || isDraftMode,
    attachments,
    toRecipients,
    ccRecipients,
    bccRecipients,
    subject: subjectValue,
    editor,
    attachmentsSessionKey,
  });

  const closeDialog = useCallback(() => {
    clearAttachments();
    clearDraftRef();
    clearComposeMessage();
    editor.commands.clearContent();
    onComposeMessageDialogClose(ActionDialog.ComposeMessage);
    hydratedForwardAttachmentsRef.current = false;
    hydratedPersistedAttachmentsRef.current = false;
    sessionKeyHydratedRef.current = false;
  }, [editor, clearDraftRef, clearComposeMessage, onComposeMessageDialogClose, clearAttachments]);

  const onClose = useCallback(async () => {
    try {
      await saveDraft();
      closeDialog();
    } catch {
      ErrorService.instance.notifyUser(translate('errors.mail.draftSaveFailed'));
    }
  }, [closeDialog, saveDraft, translate]);

  const onSent = useCallback(async () => {
    closeDialog();
  }, [closeDialog]);

  const onDiscardDraft = useCallback(async () => {
    try {
      await handleDraftDiscard();
      closeDialog();
    } catch {
      ErrorService.instance.notifyUser(translate('errors.mail.draftDiscardFailed'));
    }
  }, [handleDraftDiscard, closeDialog, translate]);

  const { send, encryptionState, isSending } = useComposeSend({
    attachments,
    attachmentsSessionKey,
    bccRecipients,
    ccRecipients,
    editor,
    subject: subjectValue,
    toRecipients,
    isReply: isReplyMode,
    isReplyAll: isReplyAllMode,
    initialTo: item.to,
    inReplyTo: inReplyItemId,
    resolveDraftId,
    onSent,
  });

  const onFilesPicked = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addAttachmentFiles(e.target.files);
    e.target.value = '';
  };

  if (!editor) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        className={`absolute inset-0 bg-gray-100/50 transition-opacity
     duration-150 dark:bg-black/75
    `}
        onClick={isSending ? undefined : onClose}
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
            <XIcon onClick={isSending ? undefined : onClose} className={isSending ? 'opacity-40' : 'cursor-pointer'} />
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
            disabled={isSending}
            readOnly={isReplyMode}
          />
          {showCc && (
            <RecipientInput
              label={translate('modals.composeMessageDialog.cc')}
              recipients={ccRecipients}
              onAddRecipient={(email) => onAddCcRecipient?.(email)}
              onRemoveRecipient={(id) => onRemoveCcRecipient?.(id)}
              disabled={isSending}
            />
          )}
          {showBcc && (
            <RecipientInput
              label={translate('modals.composeMessageDialog.bcc')}
              recipients={bccRecipients}
              onAddRecipient={(email) => onAddBccRecipient?.(email)}
              onRemoveRecipient={(id) => onRemoveBccRecipient?.(id)}
              disabled={isSending}
            />
          )}
          <div className="flex flex-row gap-2 items-center">
            <p className="font-medium max-w-16 w-full text-gray-100">
              {translate('modals.composeMessageDialog.subject')}
            </p>
            <Input className="w-full" value={subjectValue} onChange={onSubjectChange} disabled={isSending} />
          </div>
          <div className="w-full flex border border-gray-5" />
          <EditorBar editor={editor} disabled={isSending} />
        </div>
        <div className="pt-4">
          <RichTextEditor editor={editor} />
        </div>
        <AttachmentList
          attachments={attachments}
          totalSize={attachmentsTotalSize}
          onRemove={removeAttachment}
          onRetry={retryAttachment}
        />
        <input ref={fileInputRef} type="file" multiple hidden onChange={onFilesPicked} />

        <div className="mt-5 flex flex-row justify-between items-center w-full">
          {draftSavedAt && (
            <div className="flex flex-row gap-2 items-center">
              <Button variant="ghost" onClick={onDiscardDraft} disabled={isDiscarding || isSending}>
                <TrashIcon size={24} className="text-red" />
              </Button>
              <p className="text-gray-50 font-medium">
                {translate('modals.composeMessageDialog.savedAt', { value: formatDraftSavedAt(draftSavedAt) })}
              </p>
            </div>
          )}
          <div className="ml-auto flex justify-end items-center space-x-2">
            {encryptionState === 'internxt' && (
              <span
                data-testid="encryption-badge-encrypted"
                className="inline-flex items-center gap-1 rounded-full bg-green/10 px-2.5 py-1 text-sm font-medium text-green"
              >
                <LockKeyIcon size={14} weight="fill" />
                {translate('modals.composeMessageDialog.encryptedBadge')}
              </span>
            )}
            {encryptionState === 'external' && (
              <span
                data-testid="encryption-badge-cleartext"
                className="inline-flex items-center gap-1 rounded-full bg-yellow/10 px-2.5 py-1 text-sm font-medium text-yellow"
              >
                <WarningIcon size={14} weight="fill" />
                {translate('modals.composeMessageDialog.cleartextBadge')}
              </span>
            )}
            <Button variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={isSending}>
              <PaperclipIcon size={24} />
            </Button>
            <Button
              onClick={send}
              loading={isSending}
              disabled={isSending || isUploadingAttachments || hasAttachmentErrors || isDiscarding}
              variant={'primary'}
            >
              {translate('actions.send')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
