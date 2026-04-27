import { ErrorService } from '@/services/error';
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

const logError = (action: string, error: unknown) => {
  const err = ErrorService.instance.castError(error);
  console.error(`Error while running ${action}: `, err);
};

export const usePreviewMailActions = ({
  activeMailId,
  folder,
  clearActiveMail,
  updateReadStatus,
  moveToFolder,
  deleteEmails,
}: UsePreviewMailActionsParams): PreviewMailActions => {
  const setReadStatus = useCallback(
    async (isRead: boolean) => {
      if (!activeMailId) return;
      try {
        await updateReadStatus({ emailId: activeMailId, mailbox: folder, isRead });
        clearActiveMail();
      } catch (error) {
        logError(isRead ? 'markAsRead' : 'markAsUnread', error);
      }
    },
    [activeMailId, folder, updateReadStatus, clearActiveMail],
  );

  const onMarkAsRead = useCallback(() => setReadStatus(true), [setReadStatus]);
  const onMarkAsUnread = useCallback(() => setReadStatus(false), [setReadStatus]);

  const onTrash = useCallback(async () => {
    if (!activeMailId) return;
    try {
      await deleteEmails({ emailIds: [activeMailId], sourceMailbox: folder });
      clearActiveMail();
    } catch (error) {
      logError('trash', error);
    }
  }, [activeMailId, folder, deleteEmails, clearActiveMail]);

  const onMove = useCallback(
    async (targetMailbox: FolderType) => {
      if (!activeMailId) return;
      try {
        await moveToFolder({ emailIds: [activeMailId], sourceMailbox: folder, targetMailbox });
        clearActiveMail();
      } catch (error) {
        logError('move', error);
      }
    },
    [activeMailId, folder, moveToFolder, clearActiveMail],
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
