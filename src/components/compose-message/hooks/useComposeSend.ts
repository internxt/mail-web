import { useMemo } from 'react';
import type { Editor } from '@tiptap/react';
import type {
  DeliveryMode,
  EmailAddress,
  EncryptionBlock,
  RecipientKey,
  ReplyEmailRequest,
  SendEmailRequest,
} from '@internxt/sdk/dist/mail/types';
import {
  useGetActiveDomainsQuery,
  useGetMailAccountKeysQuery,
  useLazyLookupRecipientKeysQuery,
  useReplyEmailMutation,
  useSendEmailMutation,
} from '@/store/api/mail';
import { classifyRecipients, isInternxtDomain, uniqueEmailAddresses } from '@/utils/domain';
import { MailEncryptionService, type RecipientPublicKey } from '@/services/mail-encryption';
import { ConfigService } from '@/services/config';
import notificationsService, { ToastType } from '@/services/notifications';
import { useTranslationContext } from '@/i18n';
import type { Recipient } from '../types';
import type { AttachmentTask } from './useAttachments';
import type { TranslationKey } from '@/i18n/types';
import { ComposeSendError } from '@/errors';

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
  isReply?: boolean;
  isReplyAll?: boolean;
  initialTo?: Recipient[];
  inReplyTo?: string;
  resolveDraftId?: () => Promise<string | null>;
  onSent: () => void;
}

const countByEmail = (recipients: Recipient[]): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const r of recipients) {
    const key = r.email.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
};

const sameRecipients = (current: Recipient[], initial: Recipient[]): boolean => {
  if (current.length !== initial.length) return false;
  const currentCounts = countByEmail(current);
  const initialCounts = countByEmail(initial);
  if (currentCounts.size !== initialCounts.size) return false;
  return [...currentCounts].every(([email, count]) => initialCounts.get(email) === count);
};

interface UseComposeSendResult {
  encryptionState: EncryptionState;
  isSending: boolean;
  send: () => Promise<void>;
}

export const useComposeSend = ({
  toRecipients,
  ccRecipients,
  bccRecipients,
  subject,
  editor,
  attachments,
  attachmentsSessionKey,
  isReply = false,
  isReplyAll = false,
  initialTo = [],
  inReplyTo,
  resolveDraftId,
  onSent,
}: UseComposeSendParams): UseComposeSendResult => {
  const { translate } = useTranslationContext();

  const { data: activeDomains } = useGetActiveDomainsQuery();
  const { data: senderKeys } = useGetMailAccountKeysQuery();
  const [triggerLookup] = useLazyLookupRecipientKeysQuery();
  const [sendEmail, { isLoading: isSending }] = useSendEmailMutation();
  const [replyEmail, { isLoading: isReplying }] = useReplyEmailMutation();

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

  const getAttachmentsToSend = (): SendEmailRequest['attachments'] =>
    attachments.flatMap((a) =>
      a.status === 'done' && a.blobId ? [{ blobId: a.blobId, name: a.name, size: a.size, type: a.type }] : [],
    );

  const validateSend = () => {
    if (allRecipients.length === 0) {
      throw new ComposeSendError('errors.mail.noRecipients');
    }

    if (encryptionState === 'unknown') {
      throw new ComposeSendError('errors.mail.encryptionUnavailable');
    }

    // TODO: remove this once per-recipient delivery is implemented
    if (encryptionState === 'internxt' && bccRecipients.length > 0) {
      throw new ComposeSendError('errors.mail.bccNotSupportedEncrypted');
    }

    if (!senderKeys?.address || !senderKeys.publicKey) {
      throw new ComposeSendError('errors.mail.keyLookupFailed');
    }

    if (attachments.some((a) => a.status !== 'done')) {
      throw new ComposeSendError('errors.mail.forwardAttachmentFailed');
    }
  };

  const getEncryptionEnvelope = async (): Promise<EncryptionBlock> => {
    const htmlBody = editor?.getHTML() ?? '';
    const textBody = editor?.getText() ?? '';

    const uniqueAddresses = uniqueEmailAddresses(allRecipients.map((r) => r.email));
    let lookup: RecipientKey[];
    try {
      lookup = await triggerLookup({ addresses: uniqueAddresses }).unwrap();
    } catch {
      throw new ComposeSendError('errors.mail.keyLookupFailed');
    }

    // If an Internxt recipient has no public key, the lookup is broken — never
    // fall back to the server key for them, that would silently weaken encryption.
    const missingInternxtKey = lookup.some((r) => !r.publicKey && isInternxtDomain(r.address, activeDomains ?? []));
    if (missingInternxtKey) {
      throw new ComposeSendError('errors.mail.internxtKeyMissing');
    }

    // For external recipients (no publicKey) substitute the server public key
    // so the backend can decrypt and forward the content in cleartext.
    let serverPublicKey: string | undefined;
    const hasExternal = lookup.some((r) => !r.publicKey);
    if (hasExternal) {
      try {
        serverPublicKey = ConfigService.instance.getVariable('SERVER_PUBLIC_KEY');
      } catch {
        throw new ComposeSendError('errors.mail.encryptionUnavailable');
      }
    }

    const recipientsWithKeys: RecipientPublicKey[] = [
      ...lookup.map((r) => ({
        address: r.address,
        publicKey: r.publicKey ?? serverPublicKey!,
      })),
      { address: senderKeys!.address, publicKey: senderKeys!.publicKey },
    ];

    try {
      return await MailEncryptionService.instance.buildEncryptionBlock(
        { body: htmlBody || textBody, previewText: textBody },
        recipientsWithKeys,
        attachmentsSessionKey,
      );
    } catch (error) {
      console.error('Failed to build encryption envelope', error);
      throw new ComposeSendError('errors.mail.encryptionUnavailable');
    }
  };

  const dispatchReply = async (payload: ReplyEmailRequest) => {
    if (!inReplyTo) throw new ComposeSendError('errors.mail.replyFailed');
    await replyEmail({ messageId: inReplyTo, payload }).unwrap();
  };

  const send = async () => {
    try {
      validateSend();

      const attachmentsToSend = getAttachmentsToSend();
      const encryption = await getEncryptionEnvelope();
      const deliveryMode = (encryptionState === 'internxt' ? 'INTERNXT' : 'EXTERNAL') as DeliveryMode;
      const draftId = (await resolveDraftId?.()) ?? undefined;

      const cc = ccRecipients.length ? ccRecipients.map(toEmailAddress) : undefined;
      const bcc = bccRecipients.length ? bccRecipients.map(toEmailAddress) : undefined;
      const shouldReply = isReply || isReplyAll;

      if (shouldReply) {
        const to = sameRecipients(toRecipients, initialTo) ? undefined : toRecipients.map(toEmailAddress);

        await dispatchReply({
          replyAll: isReplyAll,
          to,
          cc,
          bcc,
          subject,
          attachments: attachmentsToSend,
          encryption,
          deliveryMode,
          draftId,
        });
      } else {
        await sendEmail({
          to: toRecipients.map(toEmailAddress),
          cc,
          bcc,
          subject,
          attachments: attachmentsToSend,
          encryption,
          deliveryMode,
          draftId,
        }).unwrap();
      }

      onSent();
    } catch (error) {
      console.error('Failed to send email', error);
      const fallbackKey = isReply ? 'errors.mail.replyFailed' : 'errors.mail.sendFailed';
      const messageKey = error instanceof ComposeSendError ? error.translationKey : fallbackKey;
      notificationsService.show({ text: translate(messageKey as TranslationKey), type: ToastType.Error });
    }
  };

  return { encryptionState, isSending: isSending || isReplying, send };
};

export default useComposeSend;
