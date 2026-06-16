import { useCallback, useMemo } from 'react';
import type { Editor } from '@tiptap/react';
import type { EmailAddress, RecipientKey, SendEmailRequest } from '@internxt/sdk/dist/mail/types';
import {
  useGetActiveDomainsQuery,
  useGetMailAccountKeysQuery,
  useLazyLookupRecipientKeysQuery,
  useSendEmailMutation,
} from '@/store/api/mail';
import { classifyRecipients, uniqueEmailAddresses } from '@/utils/domain';
import { MailEncryptionService, type RecipientPublicKey } from '@/services/mail-encryption';
import notificationsService, { ToastType } from '@/services/notifications';
import { useTranslationContext } from '@/i18n';
import type { Recipient } from '../types';
import type { AttachmentTask } from './useAttachments';

export type EncryptionState = 'none' | 'unknown' | 'encrypted' | 'cleartext';

const toEmailAddress = (r: Recipient): EmailAddress => (r.name ? { name: r.name, email: r.email } : { email: r.email });

interface UseComposeSendParams {
  toRecipients: Recipient[];
  ccRecipients: Recipient[];
  bccRecipients: Recipient[];
  subject: string;
  editor: Editor | null;
  attachments: AttachmentTask[];
  attachmentsSessionKey: Uint8Array;
  inReplyTo?: string;
  onSent: () => void;
}

interface UseComposeSendResult {
  encryptionState: EncryptionState;
  isSending: boolean;
  send: () => Promise<void>;
}

/**
 * Owns the compose dialog's send pipeline: recipient classification, recipient
 * key lookup, body/preview encryption and dispatch of the send mutation. Keeps
 * `ComposeMessageDialog` focused on rendering and wiring callbacks.
 */
export const useComposeSend = ({
  toRecipients,
  ccRecipients,
  bccRecipients,
  subject,
  editor,
  attachments,
  attachmentsSessionKey,
  inReplyTo,
  onSent,
}: UseComposeSendParams): UseComposeSendResult => {
  const { translate } = useTranslationContext();

  const { data: activeDomains } = useGetActiveDomainsQuery();
  const { data: senderKeys } = useGetMailAccountKeysQuery();
  const [triggerLookup] = useLazyLookupRecipientKeysQuery();
  const [sendEmail, { isLoading: isSending }] = useSendEmailMutation();

  const allRecipients = useMemo(
    () => [...toRecipients, ...ccRecipients, ...bccRecipients],
    [toRecipients, ccRecipients, bccRecipients],
  );

  const encryptionState = useMemo<EncryptionState>(() => {
    if (allRecipients.length === 0) return 'none';
    if (!activeDomains) return 'unknown';
    return classifyRecipients(
      allRecipients.map((r) => r.email),
      activeDomains,
    ).allInternxt
      ? 'encrypted'
      : 'cleartext';
  }, [allRecipients, activeDomains]);

  const send = useCallback(async () => {
    if (allRecipients.length === 0) {
      notificationsService.show({
        text: translate('errors.mail.noRecipients'),
        type: ToastType.Warning,
      });
      return;
    }

    if (encryptionState === 'unknown') {
      notificationsService.show({
        text: translate('errors.mail.encryptionUnavailable'),
        type: ToastType.Error,
      });
      return;
    }

    const attachmentsToSend: SendEmailRequest['attachments'] = attachments
      .filter((a): a is AttachmentTask & { blobId: string } => a.status === 'done' && !!a.blobId)
      .map((a) => ({
        blobId: a.blobId,
        name: a.name,
        size: a.size,
        type: a.type,
      }));

    const htmlBody = editor?.getHTML() ?? '';
    const textBody = editor?.getText() ?? '';
    const cleartextPayload: SendEmailRequest = {
      to: toRecipients.map(toEmailAddress),
      cc: ccRecipients.length ? ccRecipients.map(toEmailAddress) : undefined,
      bcc: bccRecipients.length ? bccRecipients.map(toEmailAddress) : undefined,
      subject,
      textBody: textBody || undefined,
      htmlBody: htmlBody || undefined,
      attachments: attachmentsToSend,
      inReplyToEmailId: inReplyTo,
    };

    try {
      if (encryptionState === 'encrypted') {
        if (!senderKeys?.address || !senderKeys.publicKey) {
          notificationsService.show({
            text: translate('errors.mail.keyLookupFailed'),
            type: ToastType.Error,
          });
          return;
        }
        const uniqueAddresses = uniqueEmailAddresses(allRecipients.map((r) => r.email));
        let lookup: RecipientKey[];
        try {
          lookup = await triggerLookup({ addresses: uniqueAddresses }).unwrap();
        } catch {
          notificationsService.show({
            text: translate('errors.mail.keyLookupFailed'),
            type: ToastType.Error,
          });
          return;
        }
        const usable = lookup.filter((r): r is { address: string; publicKey: string } => Boolean(r.publicKey));

        if (usable.length !== uniqueAddresses.length) {
          notificationsService.show({
            text: translate('errors.mail.keyLookupFailed'),
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
          attachmentsSessionKey,
        );

        await sendEmail({
          to: toRecipients.map(toEmailAddress),
          cc: ccRecipients.length ? ccRecipients.map(toEmailAddress) : undefined,
          bcc: bccRecipients.length ? bccRecipients.map(toEmailAddress) : undefined,
          subject,
          encryption,
          attachments: attachmentsToSend,
          inReplyToEmailId: inReplyTo,
        }).unwrap();
      } else {
        await sendEmail(cleartextPayload).unwrap();
      }
      onSent();
    } catch {
      notificationsService.show({
        text: translate('errors.mail.sendFailed'),
        type: ToastType.Error,
      });
    }
  }, [
    allRecipients,
    editor,
    toRecipients,
    ccRecipients,
    bccRecipients,
    subject,
    encryptionState,
    senderKeys,
    attachments,
    attachmentsSessionKey,
    inReplyTo,
    triggerLookup,
    sendEmail,
    onSent,
    translate,
  ]);

  return { encryptionState, isSending, send };
};

export default useComposeSend;
