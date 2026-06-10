import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import type { DraftEmailRequest, EmailAddress } from '@internxt/sdk/dist/mail/types';
import { useDraftEmailMutation, useUpdateDraftMutation } from '@/store/api/mail';
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
}: UseDraftMessageParams): UseDraftMessageResult => {
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftIdRef = useRef<string | null>(existentDraftId);

  const [createDraft] = useDraftEmailMutation();
  const [updateDraft] = useUpdateDraftMutation();

  const buildPayload = useCallback((): DraftEmailRequest => {
    const doneAttachments = attachments
      .filter((a): a is AttachmentTask & { blobId: string } => a.status === 'done' && !!a.blobId)
      .map((a) => ({ blobId: a.blobId, name: a.name, size: a.size, type: a.type }));

    return {
      to: toRecipients.length ? toRecipients.map(toEmailAddress) : undefined,
      cc: ccRecipients.length ? ccRecipients.map(toEmailAddress) : undefined,
      bcc: bccRecipients.length ? bccRecipients.map(toEmailAddress) : undefined,
      subject: subject || undefined,
      htmlBody: editor?.getHTML() || undefined,
      textBody: editor?.getText() || undefined,
      attachments: doneAttachments.length ? doneAttachments : undefined,
    };
  }, [toRecipients, ccRecipients, bccRecipients, subject, editor, attachments]);

  const saveDraft = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setIsSaving(true);
    try {
      const payload = buildPayload();
      if (draftIdRef.current) {
        await updateDraft({ draftId: draftIdRef.current, payload }).unwrap();
      } else {
        const { id } = await createDraft(payload).unwrap();
        draftIdRef.current = id;
        setDraftId(id);
      }
    } finally {
      setIsSaving(false);
    }
  }, [buildPayload, createDraft, updateDraft]);

  // Debounced autosave on any content change
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

  return { draftId, isSaving, saveDraft };
};

export default useDraftMessage;
