import { LockKeyIcon, PaperclipIcon, WarningIcon, XIcon } from '@phosphor-icons/react';
import { useCallback, useMemo } from 'react';
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
import {
  useGetActiveDomainsQuery,
  useGetMailAccountKeysQuery,
  useLazyLookupRecipientKeysQuery,
  useSendEmailMutation,
} from '@/store/api/mail';
import { classifyRecipients, uniqueEmailAddresses } from '@/utils/domain';
import { MailEncryptionService, type RecipientPublicKey } from '@/services/mail-encryption';
import notificationsService, { ToastType } from '@/services/notifications';
import type { EmailAddress, SendEmailRequest } from '@internxt/sdk/dist/mail/types';

export interface DraftMessage {
  subject?: string;
  to?: Recipient[];
  cc?: Recipient[];
  bcc?: Recipient[];
  body?: string;
}

const toEmailAddress = (r: Recipient): EmailAddress => (r.name ? { name: r.name, email: r.email } : { email: r.email });

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

  const { data: activeDomains } = useGetActiveDomainsQuery();
  const { data: senderKeys } = useGetMailAccountKeysQuery();
  const [triggerLookup] = useLazyLookupRecipientKeysQuery();
  const [sendEmail, { isLoading: isSending }] = useSendEmailMutation();

  const allRecipients = useMemo(
    () => [...toRecipients, ...ccRecipients, ...bccRecipients],
    [toRecipients, ccRecipients, bccRecipients],
  );

  const encryptionState = useMemo<'none' | 'encrypted' | 'cleartext'>(() => {
    if (allRecipients.length === 0) return 'none';
    if (!activeDomains) return 'none';
    return classifyRecipients(
      allRecipients.map((r) => r.email),
      activeDomains,
    ).allInternxt
      ? 'encrypted'
      : 'cleartext';
  }, [allRecipients, activeDomains]);

  const onClose = useCallback(() => {
    onComposeMessageDialogClose(ActionDialog.ComposeMessage);
  }, [onComposeMessageDialogClose]);

  const handlePrimaryAction = useCallback(async () => {
    if (allRecipients.length === 0) {
      notificationsService.show({
        text: translate('modals.composeMessageDialog.errors.noRecipients'),
        type: ToastType.Warning,
      });
      return;
    }

    const htmlBody = editor?.getHTML() ?? '';
    const textBody = editor?.getText() ?? '';
    const cleartextPayload: SendEmailRequest = {
      to: toRecipients.map(toEmailAddress),
      cc: ccRecipients.length ? ccRecipients.map(toEmailAddress) : undefined,
      bcc: bccRecipients.length ? bccRecipients.map(toEmailAddress) : undefined,
      subject: subjectValue,
      textBody: textBody || undefined,
      htmlBody: htmlBody || undefined,
    };

    try {
      if (encryptionState === 'encrypted') {
        if (!senderKeys?.address || !senderKeys.publicKey) {
          notificationsService.show({
            text: translate('modals.composeMessageDialog.errors.keyLookupFailed'),
            type: ToastType.Error,
          });
          return;
        }
        const uniqueAddresses = uniqueEmailAddresses(allRecipients.map((r) => r.email));
        const lookup = await triggerLookup({ addresses: uniqueAddresses }).unwrap();
        const usable = lookup.filter((r): r is { address: string; publicKey: string } => Boolean(r.publicKey));

        if (usable.length !== uniqueAddresses.length) {
          notificationsService.show({
            text: translate('modals.composeMessageDialog.errors.keyLookupFailed'),
            type: ToastType.Error,
          });
          return;
        }

        const recipientsWithKeys: RecipientPublicKey[] = [
          ...usable,
          { address: senderKeys.address, publicKey: senderKeys.publicKey },
        ];
        const encryption = await MailEncryptionService.instance.buildEncryptionBlock(
          { body: htmlBody || textBody, previewText: textBody },
          recipientsWithKeys,
        );
        await sendEmail({
          to: toRecipients.map(toEmailAddress),
          cc: ccRecipients.length ? ccRecipients.map(toEmailAddress) : undefined,
          bcc: bccRecipients.length ? bccRecipients.map(toEmailAddress) : undefined,
          subject: subjectValue,
          encryption,
        }).unwrap();
      } else {
        await sendEmail(cleartextPayload).unwrap();
      }
      onClose();
    } catch {
      notificationsService.show({
        text: translate('modals.composeMessageDialog.errors.sendFailed'),
        type: ToastType.Error,
      });
    }
  }, [
    allRecipients,
    editor,
    toRecipients,
    ccRecipients,
    bccRecipients,
    subjectValue,
    encryptionState,
    senderKeys,
    triggerLookup,
    sendEmail,
    onClose,
    translate,
  ]);

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
            disabled={isSending}
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
        {/* !TODO: Handle attachments */}

        <div className="mt-5 flex justify-end items-center space-x-2">
          {encryptionState === 'encrypted' && (
            <span
              data-testid="encryption-badge-encrypted"
              className="inline-flex items-center gap-1 rounded-full bg-green/10 px-2.5 py-1 text-sm font-medium text-green"
            >
              <LockKeyIcon size={14} weight="fill" />
              {translate('modals.composeMessageDialog.encryptedBadge')}
            </span>
          )}
          {encryptionState === 'cleartext' && (
            <span
              data-testid="encryption-badge-cleartext"
              className="inline-flex items-center gap-1 rounded-full bg-yellow/10 px-2.5 py-1 text-sm font-medium text-yellow"
            >
              <WarningIcon size={14} weight="fill" />
              {translate('modals.composeMessageDialog.cleartextBadge')}
            </span>
          )}
          <Button variant="ghost" onClick={() => {}} disabled={isSending}>
            <PaperclipIcon size={24} />
          </Button>
          <Button onClick={handlePrimaryAction} loading={isSending} disabled={isSending} variant={'primary'}>
            {translate('actions.send')}
          </Button>
        </div>
      </div>
    </div>
  );
};
