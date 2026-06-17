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
import { NetworkService } from '@/services/network';
import { MailKeysService } from '@/services/mail-keys';
import notificationsService, { ToastType } from '@/services/notifications';
import { useTranslationContext } from '@/i18n';
import type { Recipient } from '../types';
import type { AttachmentTask, InheritedAttachment } from './useAttachments';

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
  markResolvingInherited: (id: string) => void;
  markInheritedResolved: (id: string, blobId: string) => void;
  markInheritedFailed: (id: string) => void;
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
  markResolvingInherited,
  markInheritedResolved,
  markInheritedFailed,
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

  const handleInheritAttachments = useCallback(async () => {
    const pendingInherited = attachments.filter(
      (a): a is InheritedAttachment => a.kind === 'inherited' && a.status === 'pending',
    );
    const resolvedBlobIds = new Map<string, string>();

    if (pendingInherited.length > 0) {
      const senderKeysForAttachments = MailKeysService.instance.getCurrentKeys();
      if (!senderKeysForAttachments) {
        notificationsService.show({
          text: translate('errors.mail.forwardAttachmentFailed'),
          type: ToastType.Error,
        });
        return;
      }

      for (const item of pendingInherited) {
        markResolvingInherited(item.id);
        try {
          const originalSessionKey = await MailEncryptionService.instance.decryptAttachmentsSessionKey(
            item.originalEnvelope,
            senderKeysForAttachments,
          );

          const { blob } = await NetworkService.instance.download({
            mailId: item.originalMailId,
            blobId: item.originalBlobId,
            name: item.name,
            type: item.type,
            attachmentsSessionKey: originalSessionKey,
          });
          const file = new File([blob], item.name, { type: item.type });
          const { blobId } = await NetworkService.instance.upload(attachmentsSessionKey, file);
          markInheritedResolved(item.id, blobId);
          resolvedBlobIds.set(item.id, blobId);
        } catch (error) {
          console.error('Failed to re-encrypt inherited attachment', error);
          markInheritedFailed(item.id);
          notificationsService.show({
            text: translate('errors.mail.forwardAttachmentFailed'),
            type: ToastType.Error,
          });
          return;
        }
      }
    }

    const attachmentsToSend: SendEmailRequest['attachments'] = attachments.flatMap((a) => {
      if (a.status === 'done' && a.blobId) {
        return [{ blobId: a.blobId, name: a.name, size: a.size, type: a.type }];
      }
      const justResolved = resolvedBlobIds.get(a.id);
      if (justResolved) {
        return [{ blobId: justResolved, name: a.name, size: a.size, type: a.type }];
      }
      return [];
    });

    return attachmentsToSend;
  }, [
    attachments,
    markInheritedFailed,
    markInheritedResolved,
    markResolvingInherited,
    translate,
    attachmentsSessionKey,
  ]);

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

    const attachmentsToSend = await handleInheritAttachments();

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
    handleInheritAttachments,
  ]);

  return { encryptionState, isSending, send };
};

export default useComposeSend;
