import { useCallback, useMemo, useRef, useState } from 'react';
import type { AttachmentRef } from '@internxt/sdk/dist/mail/types';
import { useTranslationContext } from '@/i18n';
import notificationsService, { ToastType } from '@/services/notifications';
import { bytesToString } from '@/utils/bytes-to-string';
import { MAX_TOTAL_ATTACHMENT_BYTES_PER_MAIL } from '@/constants';
import { ErrorService } from '@/services/error';
import { UploadManager } from '@/services/upload-manager';

export type AttachmentStatus = 'uploading' | 'done' | 'error';

export interface AttachmentTask extends Omit<AttachmentRef, 'blobId'> {
  id: string;
  status: AttachmentStatus;
  blobId?: string;
  file: File;
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

      const pending: AttachmentTask[] = list.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type ?? 'application/octet-stream',
        status: 'uploading',
        file,
      }));
      setAttachments((prev) => [...prev, ...pending]);
      pending.forEach(({ id, file }) => manager.enqueue(id, file));
    },
    [totalSize, translate, manager],
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
    retry,
    remove,
    clear,
  };
};

export default useAttachments;
