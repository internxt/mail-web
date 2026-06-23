import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import type { DraftEmailRequest, EmailAddress } from '@internxt/sdk/dist/mail/types';
import {
  useDiscardDraftMutation,
  useDraftEmailMutation,
  useGetMailAccountKeysQuery,
  useUpdateDraftMutation,
} from '@/store/api/mail';
import { MailEncryptionService } from '@/services/mail-encryption';
import type { Recipient } from '../types';
import type { AttachmentTask } from './useAttachments';

const AUTOSAVE_DELAY_MS = 10000;

const toEmailAddress = (r: Recipient): EmailAddress => (r.name ? { name: r.name, email: r.email } : { email: r.email });

const getPlainBody = (editor: Editor | null): string => editor?.getText().trim() ?? '';

const isPayloadEmpty = (payload: DraftEmailRequest, editor: Editor | null): boolean =>
  !payload.to?.length &&
  !payload.cc?.length &&
  !payload.bcc?.length &&
  !payload.subject &&
  !payload.attachments?.length &&
  !getPlainBody(editor);

const buildSignature = (payload: DraftEmailRequest, editor: Editor | null): string =>
  JSON.stringify({
    to: payload.to?.map((r) => r.email) ?? [],
    cc: payload.cc?.map((r) => r.email) ?? [],
    bcc: payload.bcc?.map((r) => r.email) ?? [],
    subject: payload.subject ?? '',
    body: getPlainBody(editor),
    attachments: [...(payload.attachments?.map((a) => a.blobId) ?? [])].sort((a, b) => a.localeCompare(b)),
  });

interface UseDraftMessageParams {
  existentDraftId?: string;
  draftReceivedAt?: string;
  subject: string;
  toRecipients: Recipient[];
  ccRecipients: Recipient[];
  bccRecipients: Recipient[];
  editor: Editor | null;
  attachments: AttachmentTask[];
  attachmentsSessionKey: Uint8Array;
}

interface UseDraftMessageResult {
  draftId: string | null;
  isSaving: boolean;
  draftSavedAt: string | null;
  isDiscarding: boolean;
  handleDraftDiscard: () => Promise<void>;
  saveDraft: () => Promise<void>;
  clearDraftRef: () => void;
}

export const useDraftMessage = ({
  existentDraftId,
  draftReceivedAt,
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
  const draftReceivedAtRef = useRef<string | null>(draftReceivedAt ?? null);
  const lastSavedSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (existentDraftId && draftIdRef.current === null) {
      draftIdRef.current = existentDraftId;
    }
  }, [existentDraftId]);

  useEffect(() => {
    if (draftReceivedAt && draftReceivedAtRef.current === null) {
      draftReceivedAtRef.current = draftReceivedAt;
    }
  }, [draftReceivedAt]);

  const [createDraft] = useDraftEmailMutation();
  const [updateDraft] = useUpdateDraftMutation();
  const [discardDraft, { isLoading: isDiscarding, reset: resetDiscardDraft }] = useDiscardDraftMutation();
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

      const signature = buildSignature(payload, editor);

      if (!draftIdRef.current && isPayloadEmpty(payload, editor)) return;
      if (draftIdRef.current && lastSavedSignatureRef.current === null) {
        lastSavedSignatureRef.current = signature;
        return;
      }
      if (signature === lastSavedSignatureRef.current) return;

      if (draftIdRef.current) {
        const { id: newDraftId, receivedAt } = await updateDraft({ draftId: draftIdRef.current, payload }).unwrap();
        draftIdRef.current = newDraftId;
        draftReceivedAtRef.current = receivedAt;
      } else {
        const { id, receivedAt } = await createDraft(payload).unwrap();
        draftIdRef.current = id;
        draftReceivedAtRef.current = receivedAt;
      }
      lastSavedSignatureRef.current = signature;
    } finally {
      setIsSaving(false);
    }
  }, [buildPayload, createDraft, updateDraft, editor]);

  const handleDraftDiscard = useCallback(async () => {
    if (!draftIdRef.current) return;
    await discardDraft({ draftId: draftIdRef.current }).unwrap();
  }, [discardDraft]);

  const clearDraftRef = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    draftIdRef.current = null;
    draftReceivedAtRef.current = null;
    lastSavedSignatureRef.current = null;
    resetDiscardDraft();
  }, [resetDiscardDraft]);

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

  return {
    draftId: draftIdRef.current,
    draftSavedAt: draftReceivedAtRef.current,
    isSaving,
    isDiscarding,
    handleDraftDiscard,
    saveDraft,
    clearDraftRef,
  };
};

export default useDraftMessage;
