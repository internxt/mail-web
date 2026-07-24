import { useCallback, useMemo, useRef, useState } from 'react';
import type { EncryptionBlock } from '@internxt/sdk/dist/mail/types';
import { useTranslationContext } from '@/i18n';
import notificationsService, { ToastType } from '@/services/notifications';
import { bytesToString } from '@/utils/bytes-to-string';
import { MAX_TOTAL_ATTACHMENT_BYTES_PER_MAIL } from '@/constants';
import { ErrorService } from '@/services/error';
import { UploadManager } from '@/services/upload-manager';
import { MailEncryptionService } from '@/services/mail-encryption';
import { NetworkService } from '@/services/network';
import { MailKeysService } from '@/services/mail-keys';
import type { PersistedAttachmentInput } from './useInitialComposeState';

export type AttachmentStatus = 'pending' | 'uploading' | 'done' | 'error';

interface AttachmentBase {
  id: string;
  name: string;
  size: number;
  type: string;
  status: AttachmentStatus;
  blobId?: string;
}

export interface UploadedAttachment extends AttachmentBase {
  kind: 'uploaded';
  file?: File;
}

export interface InheritedAttachment extends AttachmentBase {
  kind: 'inherited';
  originalMailId: string;
  originalBlobId: string;
  originalEnvelope: EncryptionBlock;
}

export type AttachmentTask = UploadedAttachment | InheritedAttachment;

export interface InheritedAttachmentInput {
  originalMailId: string;
  originalBlobId: string;
  originalEnvelope: EncryptionBlock;
  name: string;
  size: number;
  type: string;
}

const useAttachments = (sessionKey: Uint8Array) => {
  const { translate } = useTranslationContext();
  const [attachments, setAttachments] = useState<AttachmentTask[]>([]);

  const managerRef = useRef<UploadManager | null>(null);
  managerRef.current ??= new UploadManager(sessionKey, {
    onSuccess: (id, blobId) =>
      setAttachments((prev) => prev.map((a) => (a.id === id ? { ...a, blobId, status: 'done' } : a))),
    onError: (id, error) => {
      console.error('ERROR UPLOADING ATTACHMENT', ErrorService.instance.castError(error));
      setAttachments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'error' } : a)));
    },
  });

  const manager = managerRef.current;

  const totalSize = useMemo(() => attachments.reduce((s, a) => s + a.size, 0), [attachments]);
  const isUploading = useMemo(() => attachments.some((a) => a.status === 'uploading'), [attachments]);
  const hasErrors = useMemo(() => attachments.some((a) => a.status === 'error'), [attachments]);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      const incoming = list.reduce((s, f) => s + f.size, 0);
      if (totalSize + incoming > MAX_TOTAL_ATTACHMENT_BYTES_PER_MAIL) {
        notificationsService.show({
          text: translate('modals.composeMessageDialog.errors.attachmentsTooLarge', {
            maxSize: bytesToString({ size: MAX_TOTAL_ATTACHMENT_BYTES_PER_MAIL }),
          }),
          type: ToastType.Warning,
        });
        return;
      }

      const pending: UploadedAttachment[] = list.map((file) => ({
        kind: 'uploaded',
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type ?? 'application/octet-stream',
        status: 'uploading',
        file,
      }));
      setAttachments((prev) => [...prev, ...pending]);
      pending.forEach(({ id, file }) => manager.enqueue(id, file as File));
    },
    [totalSize, translate, manager],
  );

  const resolveInherited = useCallback(
    async (item: InheritedAttachment) => {
      setAttachments((prev) => prev.map((a) => (a.id === item.id ? { ...a, status: 'uploading' } : a)));
      try {
        const senderKeys = MailKeysService.instance.getCurrentKeys();
        const senderAddress = MailKeysService.instance.getCurrentAddress();
        if (!senderKeys || !senderAddress) throw new Error('Missing sender keys');

        const originalSessionKey = await MailEncryptionService.instance.decryptAttachmentsSessionKey(
          item.originalEnvelope,
          senderKeys,
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
        const { blobId } = await NetworkService.instance.upload(sessionKey, file);
        setAttachments((prev) => prev.map((a) => (a.id === item.id ? { ...a, status: 'done', blobId } : a)));
      } catch (error) {
        console.error('Failed to re-encrypt inherited attachment', ErrorService.instance.castError(error));
        setAttachments((prev) => prev.map((a) => (a.id === item.id ? { ...a, status: 'error' } : a)));
      }
    },
    [sessionKey],
  );

  const addInheritedAttachments = useCallback(
    (items: InheritedAttachmentInput[]) => {
      if (items.length === 0) return;
      const incoming = items.reduce((s, item) => s + item.size, 0);
      if (totalSize + incoming > MAX_TOTAL_ATTACHMENT_BYTES_PER_MAIL) {
        notificationsService.show({
          text: translate('modals.composeMessageDialog.errors.attachmentsTooLarge', {
            maxSize: bytesToString({ size: MAX_TOTAL_ATTACHMENT_BYTES_PER_MAIL }),
          }),
          type: ToastType.Warning,
        });
        return;
      }

      const inherited: InheritedAttachment[] = items.map((item) => ({
        kind: 'inherited',
        id: crypto.randomUUID(),
        name: item.name,
        size: item.size,
        type: item.type ?? 'application/octet-stream',
        status: 'pending',
        originalMailId: item.originalMailId,
        originalBlobId: item.originalBlobId,
        originalEnvelope: item.originalEnvelope,
      }));
      setAttachments((prev) => [...prev, ...inherited]);
      inherited.forEach((item) => void resolveInherited(item));
    },
    [totalSize, translate, resolveInherited],
  );

  const addPersistedAttachments = useCallback(
    (items: PersistedAttachmentInput[]) => {
      if (items.length === 0) return;
      const incoming = items.reduce((s, item) => s + item.size, 0);
      if (totalSize + incoming > MAX_TOTAL_ATTACHMENT_BYTES_PER_MAIL) {
        notificationsService.show({
          text: translate('modals.composeMessageDialog.errors.attachmentsTooLarge', {
            maxSize: bytesToString({ size: MAX_TOTAL_ATTACHMENT_BYTES_PER_MAIL }),
          }),
          type: ToastType.Warning,
        });
        return;
      }

      const persisted: UploadedAttachment[] = items.map((item) => ({
        kind: 'uploaded',
        id: crypto.randomUUID(),
        name: item.name,
        size: item.size,
        type: item.type ?? 'application/octet-stream',
        status: 'done',
        blobId: item.blobId,
      }));
      setAttachments((prev) => [...prev, ...persisted]);
    },
    [totalSize, translate],
  );

  const retry = useCallback(
    (id: string) => {
      setAttachments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'uploading' } : a)));
      manager.retry(id);
    },
    [manager],
  );

  const remove = useCallback(
    (id: string) => {
      manager.cancel(id);
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    },
    [manager],
  );

  const clear = useCallback(() => {
    manager.clear();
    setAttachments([]);
  }, [manager]);

  return {
    attachments,
    totalSize,
    isUploading,
    hasErrors,
    addFiles,
    addInheritedAttachments,
    addPersistedAttachments,
    retry,
    remove,
    clear,
  };
};

export default useAttachments;
