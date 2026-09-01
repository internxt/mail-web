import { ErrorService } from '@/services/error';
import { useTranslationContext } from '@/i18n';
import type { FolderType } from '@/types/mail';
import { useCallback } from 'react';
import type { EmailListResponse } from '@internxt/sdk/dist/mail/types';
import { ActionDialog, type OpenDialog } from '@/context/dialog-manager/types';

type MailAction = 'markAsRead' | 'markAsUnread' | 'trash' | 'move';

interface UseBulkMailActionsParams {
  folder: FolderType;
  selectedEmails: string[];
  listFolderEmails: EmailListResponse['emails'] | undefined;
  clearSelection: () => void;
  updateReadStatus: (args: { emailId: string; mailbox: FolderType; isRead: boolean }) => Promise<void>;
  moveToFolder: (args: { emailIds: string[]; sourceMailbox: FolderType; targetMailbox: FolderType }) => Promise<void>;
  deleteEmails: (args: { emailIds: string[]; sourceMailbox: FolderType }) => Promise<void>;
  openDialog: OpenDialog;
}

interface BulkMailActions {
  areAllSelectedRead: boolean;
  onMarkAsRead: () => void;
  onMarkAsUnread: () => void;
  onTrash: () => void;
  onMove: (targetMailbox: FolderType) => void;
}

export const useBulkMailActions = ({
  folder,
  selectedEmails,
  listFolderEmails,
  clearSelection,
  updateReadStatus,
  moveToFolder,
  deleteEmails,
  openDialog,
}: UseBulkMailActionsParams): BulkMailActions => {
  const { translate } = useTranslationContext();

  const notifyError = useCallback(
    (action: MailAction, error: unknown) => {
      const err = ErrorService.instance.castError(error);
      console.error(`Error while running bulk ${action}: `, err);
      ErrorService.instance.notifyUser(translate(`errors.mail.${action}`));
    },
    [translate],
  );

  const areAllSelectedRead =
    selectedEmails.length > 0 &&
    selectedEmails.every((id) => listFolderEmails?.find((email) => email.id === id)?.isRead === true);

  const setReadStatus = useCallback(
    async (isRead: boolean) => {
      if (selectedEmails.length === 0) return;

      try {
        await Promise.all(selectedEmails.map((emailId) => updateReadStatus({ emailId, mailbox: folder, isRead })));
      } catch (error) {
        notifyError(isRead ? 'markAsRead' : 'markAsUnread', error);
      }
    },
    [selectedEmails, folder, updateReadStatus, notifyError],
  );

  const onMarkAsRead = useCallback(() => void setReadStatus(true), [setReadStatus]);
  const onMarkAsUnread = useCallback(() => void setReadStatus(false), [setReadStatus]);

  const performTrash = useCallback(async () => {
    try {
      await deleteEmails({ emailIds: selectedEmails, sourceMailbox: folder });
      clearSelection();
    } catch (error) {
      notifyError('trash', error);
    }
  }, [selectedEmails, folder, deleteEmails, clearSelection, notifyError]);

  const onTrash = useCallback(() => {
    if (selectedEmails.length === 0) return;

    if (folder === 'trash') {
      openDialog(ActionDialog.ConfirmDeletePermanently, {
        data: { count: selectedEmails.length, onConfirm: () => performTrash() },
      });
      return;
    }

    void performTrash();
  }, [selectedEmails, folder, openDialog, performTrash]);

  const onMove = useCallback(
    async (targetMailbox: FolderType) => {
      if (selectedEmails.length === 0) return;

      try {
        await moveToFolder({ emailIds: selectedEmails, sourceMailbox: folder, targetMailbox });
        clearSelection();
      } catch (error) {
        notifyError('move', error);
      }
    },
    [selectedEmails, folder, moveToFolder, clearSelection, notifyError],
  );

  return {
    areAllSelectedRead,
    onMarkAsRead,
    onMarkAsUnread,
    onTrash,
    onMove,
  };
};
