import { useCallback, useMemo } from 'react';
import type { Editor } from '@tiptap/react';
import type { DeliveryMode, EmailAddress, RecipientKey, SendEmailRequest } from '@internxt/sdk/dist/mail/types';
import {
  useGetActiveDomainsQuery,
  useGetMailAccountKeysQuery,
  useLazyLookupRecipientKeysQuery,
  useSendEmailMutation,
} from '@/store/api/mail';
import { classifyRecipients, isInternxtDomain, uniqueEmailAddresses } from '@/utils/domain';
import { MailEncryptionService, type RecipientPublicKey } from '@/services/mail-encryption';
import { ConfigService } from '@/services/config';
import notificationsService, { ToastType } from '@/services/notifications';
import { useTranslationContext } from '@/i18n';
import type { Recipient } from '../types';
import type { AttachmentTask } from './useAttachments';

export type EncryptionState = 'none' | 'unknown' | 'internxt' | 'external';

const toEmailAddress = (r: Recipient): EmailAddress => (r.name ? { name: r.name, email: r.email } : { email: r.email });

interface UseComposeSendParams {
  toRecipients: Recipient[];
  ccRecipients: Recipient[];
  bccRecipients: Recipient[];
  subject: string;
  editor: Editor | null;
  attachments: AttachmentTask[];
  attachmentsSessionKey: Uint8Array;
  onSent: () => void;
}

interface UseComposeSendResult {
  encryptionState: EncryptionState;
  isSending: boolean;
  send: () => Promise<void>;
}

/**
 * Owns the compose dialog's send pipeline: recipient classification, recipient
 * key lookup, encryption and dispatch. The body and attachments are always
 * encrypted. For Internxt recipients the real public key is used; for external
 * recipients SERVER_PUBLIC_KEY is used so the backend can decrypt and forward
 * the content in cleartext.
 */
export const useComposeSend = ({
  toRecipients,
  ccRecipients,
  bccRecipients,
  subject,
  editor,
  attachments,
  attachmentsSessionKey,
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
      ? 'internxt'
      : 'external';
  }, [allRecipients, activeDomains]);

  const send = useCallback(async () => {
    if (allRecipients.length === 0) {
      notificationsService.show({ text: translate('errors.mail.noRecipients'), type: ToastType.Warning });
      return;
    }

    if (encryptionState === 'unknown') {
      notificationsService.show({ text: translate('errors.mail.encryptionUnavailable'), type: ToastType.Error });
      return;
    }

    if (!senderKeys?.address || !senderKeys.publicKey) {
      notificationsService.show({ text: translate('errors.mail.keyLookupFailed'), type: ToastType.Error });
      return;
    }

    const attachmentsToSend: SendEmailRequest['attachments'] = attachments
      .filter((a): a is AttachmentTask & { blobId: string } => a.status === 'done' && !!a.blobId)
      .map((a) => ({ blobId: a.blobId, name: a.name, size: a.size, type: a.type }));

    const htmlBody = editor?.getHTML() ?? '';
    const textBody = editor?.getText() ?? '';

    try {
      const uniqueAddresses = uniqueEmailAddresses(allRecipients.map((r) => r.email));
      let lookup: RecipientKey[];
      try {
        lookup = await triggerLookup({ addresses: uniqueAddresses }).unwrap();
      } catch {
        notificationsService.show({ text: translate('errors.mail.keyLookupFailed'), type: ToastType.Error });
        return;
      }

      // If an Internxt recipient has no public key, the lookup is broken — never
      // fall back to the server key for them, that would silently weaken encryption.
      const missingInternxtKey = lookup.some((r) => !r.publicKey && isInternxtDomain(r.address, activeDomains ?? []));
      if (missingInternxtKey) {
        notificationsService.show({ text: translate('errors.mail.internxtKeyMissing'), type: ToastType.Error });
        return;
      }

      // For external recipients (no publicKey) substitute the server public key
      // so the backend can decrypt and forward the content in cleartext.
      let serverPublicKey: string | undefined;
      const hasExternal = lookup.some((r) => !r.publicKey);
      if (hasExternal) {
        try {
          serverPublicKey = ConfigService.instance.getVariable('SERVER_PUBLIC_KEY');
        } catch {
          notificationsService.show({ text: translate('errors.mail.encryptionUnavailable'), type: ToastType.Error });
          return;
        }
      }

      const recipientsWithKeys: RecipientPublicKey[] = [
        ...lookup.map((r) => ({
          address: r.address,
          publicKey: r.publicKey ?? serverPublicKey!,
        })),
        { address: senderKeys.address, publicKey: senderKeys.publicKey },
      ];

      const encryption = await MailEncryptionService.instance.buildEncryptionBlock(
        { body: htmlBody || textBody, previewText: textBody },
        recipientsWithKeys,
        attachmentsSessionKey,
      );

      const deliveryMode = (encryptionState === 'internxt' ? 'INTERNXT' : 'EXTERNAL') as DeliveryMode;

      await sendEmail({
        to: toRecipients.map(toEmailAddress),
        cc: ccRecipients.length ? ccRecipients.map(toEmailAddress) : undefined,
        bcc: bccRecipients.length ? bccRecipients.map(toEmailAddress) : undefined,
        subject,
        attachments: attachmentsToSend,
        encryption,
        deliveryMode,
      }).unwrap();

      onSent();
    } catch (error) {
      console.error('Failed to send email', error);
      notificationsService.show({ text: translate('errors.mail.sendFailed'), type: ToastType.Error });
    }
  }, [
    allRecipients,
    activeDomains,
    editor,
    toRecipients,
    ccRecipients,
    bccRecipients,
    subject,
    encryptionState,
    senderKeys,
    attachments,
    attachmentsSessionKey,
    triggerLookup,
    sendEmail,
    onSent,
    translate,
  ]);

  return { encryptionState, isSending, send };
};

export default useComposeSend;
