import { useCallback, useMemo, useState } from 'react';
import { useTranslationContext } from '@/i18n';
import notificationsService, { ToastType } from '@/services/notifications';
import { UploadManager } from '@/services/upload-manager';
import type { AttachmentRef } from '@internxt/sdk/dist/mail/types';
import type { UploadAttachmentCallbacks } from '@/types/mail/upload-manager';

export type AttachmentStatus = 'uploading' | 'done' | 'error';

export interface AttachmentTask extends Omit<AttachmentRef, 'blobId'> {
  id: string;
  status: AttachmentStatus;
  blobId?: string;
}

export const MAX_TOTAL_ATTACHMENT_BYTES = 25 * 1024 * 1024;

const useAttachments = () => {
  const { translate } = useTranslationContext();
  const [attachments, setAttachments] = useState<AttachmentTask[]>([]);

  const totalSize = useMemo(() => attachments.reduce((s, a) => s + a.size, 0), [attachments]);
  const isUploading = useMemo(() => attachments.some((a) => a.status === 'uploading'), [attachments]);
  const hasErrors = useMemo(() => attachments.some((a) => a.status === 'error'), [attachments]);

  const callbacks: UploadAttachmentCallbacks = useMemo(
    () => ({
      onSuccess: (id, { blobId }) =>
        setAttachments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'done', blobId } : a))),
      onError: (id) => setAttachments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'error' } : a))),
    }),
    [],
  );

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      const incoming = list.reduce((s, f) => s + f.size, 0);
      if (totalSize + incoming > MAX_TOTAL_ATTACHMENT_BYTES) {
        notificationsService.show({
          text: translate('modals.composeMessageDialog.errors.attachmentsTooLarge'),
          type: ToastType.Warning,
        });
        return;
      }
      const handles = UploadManager.instance.run(list, callbacks);
      const pending: AttachmentTask[] = handles.map(({ id, file }) => ({
        id,
        name: file.name,
        size: file.size,
        type: file.type ?? 'application/octet-stream',
        status: 'uploading',
      }));
      setAttachments((prev) => [...prev, ...pending]);
    },
    [totalSize, translate, callbacks],
  );

  const retry = useCallback(
    (id: string) => {
      setAttachments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'uploading' } : a)));
      UploadManager.instance.retry(id, callbacks);
    },
    [callbacks],
  );

  const remove = useCallback((id: string) => {
    UploadManager.instance.remove(id);
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clear = useCallback(() => {
    setAttachments((prev) => {
      const ids = prev.map((a) => a.id);
      queueMicrotask(() => ids.forEach((id) => UploadManager.instance.remove(id)));
      return [];
    });
  }, []);

  return { attachments, totalSize, isUploading, hasErrors, addFiles, retry, remove, clear };
};

export default useAttachments;
