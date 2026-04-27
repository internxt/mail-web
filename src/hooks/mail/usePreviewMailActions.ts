import { ErrorService } from '@/services/error';
import { useTranslationContext } from '@/i18n';
import type { FolderType } from '@/types/mail';
import { useCallback } from 'react';

interface UsePreviewMailActionsParams {
  activeMailId: string | undefined;
  folder: FolderType;
  clearActiveMail: () => void;
  updateReadStatus: (args: { emailId: string; mailbox: FolderType; isRead: boolean }) => Promise<void>;
  moveToFolder: (args: { emailIds: string[]; sourceMailbox: FolderType; targetMailbox: FolderType }) => Promise<void>;
  deleteEmails: (args: { emailIds: string[]; sourceMailbox: FolderType }) => Promise<void>;
}

interface PreviewMailActions {
  onMarkAsRead: () => void;
  onMarkAsUnread: () => void;
  onTrash: () => void;
  onMove: (targetMailbox: FolderType) => void;
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
}

export const usePreviewMailActions = ({
  activeMailId,
  folder,
  clearActiveMail,
  updateReadStatus,
  moveToFolder,
  deleteEmails,
}: UsePreviewMailActionsParams): PreviewMailActions => {
  const { translate } = useTranslationContext();

  const notifyError = useCallback(
    (action: string, messageKey: Parameters<typeof translate>[0], error: unknown) => {
      const err = ErrorService.instance.castError(error);
      console.error(`Error while running ${action}: `, err);
      ErrorService.instance.notifyUser(translate(messageKey));
    },
    [translate],
  );

  const setReadStatus = useCallback(
    async (isRead: boolean) => {
      if (!activeMailId) return;
      try {
        await updateReadStatus({ emailId: activeMailId, mailbox: folder, isRead });
      } catch (error) {
        notifyError(
          isRead ? 'markAsRead' : 'markAsUnread',
          isRead ? 'errors.mail.markAsRead' : 'errors.mail.markAsUnread',
          error,
        );
      }
    },
    [activeMailId, folder, updateReadStatus, notifyError],
  );

  const onMarkAsRead = useCallback(() => setReadStatus(true), [setReadStatus]);
  const onMarkAsUnread = useCallback(() => setReadStatus(false), [setReadStatus]);

  const onTrash = useCallback(async () => {
    if (!activeMailId) return;
    try {
      await deleteEmails({ emailIds: [activeMailId], sourceMailbox: folder });
      clearActiveMail();
    } catch (error) {
      notifyError('trash', 'errors.mail.trash', error);
    }
  }, [activeMailId, folder, deleteEmails, clearActiveMail, notifyError]);

  const onMove = useCallback(
    async (targetMailbox: FolderType) => {
      if (!activeMailId) return;
      try {
        await moveToFolder({ emailIds: [activeMailId], sourceMailbox: folder, targetMailbox });
        clearActiveMail();
      } catch (error) {
        notifyError('move', 'errors.mail.move', error);
      }
    },
    [activeMailId, folder, moveToFolder, clearActiveMail, notifyError],
  );

  const noop = useCallback(() => {}, []);

  return {
    onMarkAsRead,
    onMarkAsUnread,
    onTrash,
    onMove,
    onReply: noop,
    onReplyAll: noop,
    onForward: noop,
  };
};
