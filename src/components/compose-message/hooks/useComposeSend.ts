import { useCallback, useMemo } from 'react';
import type { Editor } from '@tiptap/react';
import type {
  DeliveryMode,
  EmailAddress,
  EncryptionBlock,
  RecipientKey,
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
import { NetworkService } from '@/services/network';
import { MailKeysService } from '@/services/mail-keys';
import { ConfigService } from '@/services/config';
import notificationsService, { ToastType } from '@/services/notifications';
import { useTranslationContext } from '@/i18n';
import type { Recipient } from '../types';
import type { AttachmentTask, InheritedAttachment } from './useAttachments';
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
  inReplyTo?: string;
  resolveDraftId?: () => Promise<string | null>;
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

export const useComposeSend = ({
  toRecipients,
  ccRecipients,
  bccRecipients,
  subject,
  editor,
  attachments,
  attachmentsSessionKey,
  isReply = false,
  inReplyTo,
  resolveDraftId,
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

  const handleInheritAttachments = useCallback(async () => {
    const pendingInherited = attachments.filter(
      (a): a is InheritedAttachment => a.kind === 'inherited' && a.status === 'pending',
    );
    const resolvedBlobIds = new Map<string, string>();

    if (pendingInherited.length > 0) {
      const senderKeysForAttachments = MailKeysService.instance.getCurrentKeys();
      const senderAddress = MailKeysService.instance.getCurrentAddress();
      if (!senderKeysForAttachments || !senderAddress) {
        throw new ComposeSendError('errors.mail.forwardAttachmentFailed');
      }

      for (const item of pendingInherited) {
        markResolvingInherited(item.id);
        try {
          const originalSessionKey = await MailEncryptionService.instance.decryptAttachmentsSessionKey(
            item.originalEnvelope,
            senderKeysForAttachments,
            senderAddress,
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
          throw new ComposeSendError('errors.mail.forwardAttachmentFailed');
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
  }, [attachments, markInheritedFailed, markInheritedResolved, markResolvingInherited, attachmentsSessionKey]);

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

  const dispatchEmail = async (payload: SendEmailRequest) => {
    if (isReply) {
      if (!inReplyTo) throw new ComposeSendError('errors.mail.replyFailed');
      await replyEmail({ messageId: inReplyTo, payload }).unwrap();
      return;
    }

    await sendEmail(payload).unwrap();
  };

  const send = async () => {
    try {
      validateSend();

      const attachmentsToSend = await handleInheritAttachments();
      const encryption = await getEncryptionEnvelope();
      const deliveryMode = (encryptionState === 'internxt' ? 'INTERNXT' : 'EXTERNAL') as DeliveryMode;
      const draftId = (await resolveDraftId?.()) ?? undefined;

      const payload: SendEmailRequest = {
        to: toRecipients.map(toEmailAddress),
        cc: ccRecipients.length ? ccRecipients.map(toEmailAddress) : undefined,
        bcc: bccRecipients.length ? bccRecipients.map(toEmailAddress) : undefined,
        subject,
        attachments: attachmentsToSend,
        encryption,
        deliveryMode,
        draftId,
      };

      await dispatchEmail(payload);

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
