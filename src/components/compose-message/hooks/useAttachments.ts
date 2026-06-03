import { useCallback, useMemo, useState } from 'react';
import { useTranslationContext } from '@/i18n';
import notificationsService, { ToastType } from '@/services/notifications';
import { bytesToString } from '@/utils/bytes-to-string';
import { UploadManager } from '@/services/upload-manager';
import type { AttachmentRef } from '@internxt/sdk/dist/mail/types';
import { MAX_TOTAL_ATTACHMENT_BYTES_PER_MAIL } from '@/constants';
import type { UploadAttachmentCallbacks } from '@/types/mail/upload-manager';
import { ErrorService } from '@/services/error';

export type AttachmentStatus = 'uploading' | 'done' | 'error';

export interface AttachmentTask extends Omit<AttachmentRef, 'blobId'> {
  id: string;
  status: AttachmentStatus;
  blobId?: string;
}

const useAttachments = () => {
  const { translate } = useTranslationContext();
  const [attachments, setAttachments] = useState<AttachmentTask[]>([]);

  const totalSize = useMemo(() => attachments.reduce((s, a) => s + a.size, 0), [attachments]);
  const isUploading = useMemo(() => attachments.some((a) => a.status === 'uploading'), [attachments]);
  const hasErrors = useMemo(() => attachments.some((a) => a.status === 'error'), [attachments]);

  const onTaskCompleted = (attachmentTaskId: AttachmentTask['id'], blobId: string) => {
    setAttachments((prev) => prev.map((a) => (a.id === attachmentTaskId ? { ...a, blobId, status: 'done' } : a)));
  };

  const onTaskError = (attachmentTaskId: AttachmentTask['id'], error: unknown) => {
    const castedError = ErrorService.instance.castError(error);
    setAttachments((prev) => prev.map((a) => (a.id === attachmentTaskId ? { ...a, status: 'error' } : a)));
    console.error('ERROR UPLOADING ATTACHMENT', castedError);
  };

  const callbacks: UploadAttachmentCallbacks = {
    onSuccess: onTaskCompleted,
    onError: onTaskError,
  };

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
    UploadManager.instance.clear();
    setAttachments([]);
  }, []);

  return { attachments, totalSize, isUploading, hasErrors, addFiles, retry, remove, clear };
};

export default useAttachments;
