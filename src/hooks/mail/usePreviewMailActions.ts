import { ErrorService } from '@/services/error';
import { useTranslationContext } from '@/i18n';
import type { ComposePayload, FolderType } from '@/types/mail';
import { useCallback } from 'react';
import type { EmailResponse } from '@internxt/sdk/dist/mail/types';
import { ActionDialog, type OpenDialog } from '@/context/dialog-manager/types';

type MailAction = 'markAsRead' | 'markAsUnread' | 'trash' | 'move';

interface UsePreviewMailActionsParams {
  activeMailId: string | undefined;
  folder: FolderType;
  decryptedMail: EmailResponse | undefined;
  clearActiveMail: () => void;
  updateReadStatus: (args: { emailId: string; mailbox: FolderType; isRead: boolean }) => Promise<void>;
  moveToFolder: (args: { emailIds: string[]; sourceMailbox: FolderType; targetMailbox: FolderType }) => Promise<void>;
  deleteEmails: (args: { emailIds: string[]; sourceMailbox: FolderType }) => Promise<void>;
  openDialog: OpenDialog;
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
  decryptedMail,
  clearActiveMail,
  updateReadStatus,
  moveToFolder,
  deleteEmails,
  openDialog,
}: UsePreviewMailActionsParams): PreviewMailActions => {
  const { translate } = useTranslationContext();

  const notifyError = useCallback(
    (action: MailAction, error: unknown) => {
      const err = ErrorService.instance.castError(error);
      console.error(`Error while running ${action}: `, err);
      ErrorService.instance.notifyUser(translate(`errors.mail.${action}`));
    },
    [translate],
  );

  const setReadStatus = useCallback(
    async (isRead: boolean) => {
      if (!activeMailId) return;
      try {
        await updateReadStatus({ emailId: activeMailId, mailbox: folder, isRead });
      } catch (error) {
        notifyError(isRead ? 'markAsRead' : 'markAsUnread', error);
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
      notifyError('trash', error);
    }
  }, [activeMailId, folder, deleteEmails, clearActiveMail, notifyError]);

  const onMove = useCallback(
    async (targetMailbox: FolderType) => {
      if (!activeMailId) return;
      try {
        await moveToFolder({ emailIds: [activeMailId], sourceMailbox: folder, targetMailbox });
        clearActiveMail();
      } catch (error) {
        notifyError('move', error);
      }
    },
    [activeMailId, folder, moveToFolder, clearActiveMail, notifyError],
  );

  const onReply = useCallback(() => {
    if (!decryptedMail) return;

    const openComposeDialogData = {
      mode: 'reply',
      sourceMail: decryptedMail,
    } satisfies ComposePayload;

    openDialog(ActionDialog.ComposeMessage, {
      data: openComposeDialogData,
      closeAllDialogsFirst: true,
    });
  }, [decryptedMail, openDialog]);

  const onForward = useCallback(() => {
    if (!decryptedMail) return;
    const openComposeDialogData = {
      mode: 'forward',
      sourceMail: decryptedMail,
    } satisfies ComposePayload;

    openDialog(ActionDialog.ComposeMessage, {
      data: openComposeDialogData,
      closeAllDialogsFirst: true,
    });
  }, [decryptedMail, openDialog]);

  const noop = useCallback(() => {}, []);

  return {
    onMarkAsRead,
    onMarkAsUnread,
    onTrash,
    onMove,
    onReply,
    onReplyAll: noop,
    onForward,
  };
};
