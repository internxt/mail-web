import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import type { DraftEmailRequest, EmailAddress } from '@internxt/sdk/dist/mail/types';
import { useDraftEmailMutation, useGetMailAccountKeysQuery, useUpdateDraftMutation } from '@/store/api/mail';
import { MailEncryptionService } from '@/services/mail-encryption';
import type { Recipient } from '../types';
import type { AttachmentTask } from './useAttachments';

const AUTOSAVE_DELAY_MS = 3000;

const toEmailAddress = (r: Recipient): EmailAddress => (r.name ? { name: r.name, email: r.email } : { email: r.email });

interface UseDraftMessageParams {
  existentDraftId?: string;
  toRecipients: Recipient[];
  ccRecipients: Recipient[];
  bccRecipients: Recipient[];
  subject: string;
  editor: Editor | null;
  attachments: AttachmentTask[];
  attachmentsSessionKey: Uint8Array;
}

interface UseDraftMessageResult {
  draftId: string | null;
  isSaving: boolean;
  saveDraft: () => Promise<void>;
}

export const useDraftMessage = ({
  existentDraftId,
  toRecipients,
  ccRecipients,
  bccRecipients,
  subject,
  editor,
  attachments,
  attachmentsSessionKey,
}: UseDraftMessageParams): UseDraftMessageResult => {
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Using a ref instead an state to avoid losing data on re-renders
  const draftIdRef = useRef<string | null>(existentDraftId ?? null);

  const [createDraft] = useDraftEmailMutation();
  const [updateDraft] = useUpdateDraftMutation();
  const { data: senderKeys } = useGetMailAccountKeysQuery();

  const buildPayload = useCallback(async (): Promise<DraftEmailRequest | null> => {
    if (!senderKeys?.address || !senderKeys.publicKey) return null;

    const htmlBody = editor?.getHTML() ?? '';
    const textBody = editor?.getText() ?? '';

    const encryption = await MailEncryptionService.instance.buildEncryptionBlock(
      { body: htmlBody, previewText: textBody },
      [{ address: senderKeys.address, publicKey: senderKeys.publicKey }],
      attachmentsSessionKey,
    );

    const doneAttachments = attachments
      .filter((a): a is AttachmentTask & { blobId: string } => a.status === 'done' && !!a.blobId)
      .map((a) => ({ blobId: a.blobId, name: a.name, size: a.size, type: a.type }));

    return {
      to: toRecipients.length ? toRecipients.map(toEmailAddress) : undefined,
      cc: ccRecipients.length ? ccRecipients.map(toEmailAddress) : undefined,
      bcc: bccRecipients.length ? bccRecipients.map(toEmailAddress) : undefined,
      subject: subject || undefined,
      encryption,
      attachments: doneAttachments.length ? doneAttachments : undefined,
    };
  }, [toRecipients, ccRecipients, bccRecipients, subject, editor, attachments, attachmentsSessionKey, senderKeys]);

  const saveDraft = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setIsSaving(true);
    try {
      const payload = await buildPayload();
      if (!payload) return;
      if (draftIdRef.current) {
        const { newDraftId } = await updateDraft({ draftId: draftIdRef.current, payload }).unwrap();
        draftIdRef.current = newDraftId;
      } else {
        const { id } = await createDraft(payload).unwrap();
        draftIdRef.current = id;
      }
    } finally {
      setIsSaving(false);
    }
  }, [buildPayload, createDraft, updateDraft]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveDraft().catch(() => {
        // Autosave failures are silent; user can retry on close
      });
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toRecipients, ccRecipients, bccRecipients, subject, editor, attachments, saveDraft]);

  return { draftId: draftIdRef.current, isSaving, saveDraft };
};

export default useDraftMessage;
