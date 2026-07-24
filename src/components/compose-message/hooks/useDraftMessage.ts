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

interface UseDraftMessageParams {
  existentDraftId?: string;
  draftReceivedAt?: string;
  isDraftActive?: boolean;
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
  resolveDraftId: () => Promise<string | null>;
  clearDraftRef: () => void;
}

export const useDraftMessage = ({
  existentDraftId,
  draftReceivedAt,
  isDraftActive,
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
  const pendingSaveRef = useRef<Promise<void> | null>(null);
  const activeSavesRef = useRef(0);

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

  const clearAutosaveTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const performSave = useCallback(async () => {
    if (!isDraftActive) return;

    const payload = await buildPayload();
    if (!payload) return;

    if (!draftIdRef.current && isPayloadEmpty(payload, editor)) return;

    if (draftIdRef.current) {
      const { id: newDraftId, receivedAt } = await updateDraft({ draftId: draftIdRef.current, payload }).unwrap();
      draftIdRef.current = newDraftId;
      draftReceivedAtRef.current = receivedAt;
      return;
    }

    const { id, receivedAt } = await createDraft(payload).unwrap();
    draftIdRef.current = id;
    draftReceivedAtRef.current = receivedAt;
  }, [buildPayload, createDraft, updateDraft, isDraftActive, editor]);

  const saveDraft = useCallback(async () => {
    clearAutosaveTimer();

    const previous = pendingSaveRef.current ?? Promise.resolve();
    const current = previous.catch(() => undefined).then(performSave);
    pendingSaveRef.current = current;

    activeSavesRef.current += 1;
    setIsSaving(true);
    try {
      await current;
    } finally {
      activeSavesRef.current -= 1;
      if (activeSavesRef.current === 0) setIsSaving(false);
      if (pendingSaveRef.current === current) pendingSaveRef.current = null;
    }
  }, [performSave, clearAutosaveTimer]);

  const resolveDraftId = useCallback(async (): Promise<string | null> => {
    clearAutosaveTimer();
    if (pendingSaveRef.current) {
      try {
        await pendingSaveRef.current;
      } catch {
        // Save failed; proceed with the last id that reached the server. no op
      }
    }
    return draftIdRef.current;
  }, [clearAutosaveTimer]);

  const handleDraftDiscard = useCallback(async () => {
    const draftId = await resolveDraftId();
    if (!draftId) return;
    await discardDraft({ draftId }).unwrap();
  }, [discardDraft, resolveDraftId]);

  const clearDraftRef = useCallback(() => {
    clearAutosaveTimer();
    draftIdRef.current = null;
    draftReceivedAtRef.current = null;
    resetDiscardDraft();
  }, [resetDiscardDraft, clearAutosaveTimer]);

  const scheduleAutosave = useCallback(() => {
    clearAutosaveTimer();
    timerRef.current = setTimeout(() => {
      saveDraft().catch(() => {
        // Autosave failures are silent; user can retry on close
      });
    }, AUTOSAVE_DELAY_MS);
  }, [saveDraft, clearAutosaveTimer]);

  useEffect(() => {
    scheduleAutosave();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toRecipients, ccRecipients, bccRecipients, subject, editor, attachments, scheduleAutosave]);

  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => scheduleAutosave();
    editor.on('update', onUpdate);
    return () => {
      editor.off('update', onUpdate);
    };
  }, [editor, scheduleAutosave]);

  return {
    draftId: draftIdRef.current,
    draftSavedAt: draftReceivedAtRef.current,
    isSaving,
    isDiscarding,
    handleDraftDiscard,
    saveDraft,
    resolveDraftId,
    clearDraftRef,
  };
};

export default useDraftMessage;
