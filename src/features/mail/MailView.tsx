import { Activity, useState } from 'react';
import { useTranslationContext } from '@/i18n';
import type { FolderType } from '@/types/mail';
import Settings from './components/settings';
import {
  useDeleteMailsMutation,
  useGetThreadQuery,
  useMoveToFolderMutation,
  useUpdateReadStatusMutation,
} from '@/store/api/mail';
import { ErrorService } from '@/services/error';
import useListFolderPaginated from '@/hooks/mail/useListFolderPaginated';
import { useUnreadByMailbox } from '@/hooks/mail/useUnreadByMailbox';
import { useMailSelection } from '@/hooks/mail/useMailSelection';
import { useDecryptedPreviews } from '@/hooks/mail/useDecryptedPreviews';
import PreviewEmailEmptyState from './components/mail-preview/preview-empty-state';
import TrayHeader from './components/tray/header';
import { Tray } from '@internxt/ui';
import { TrayEmptyState } from './components/tray/tray-empty-state';
import { formatEmailsToList } from '@/utils/format-emails';
import { useListActionContext } from '@/hooks/mail/useListActionContext';
import { usePreviewMailActions } from '@/hooks/mail/usePreviewMailActions';
import ActionsBar from './components/mail-preview/actions-bar';
import { useActionDialog } from '@/context/dialog-manager';
import { ThreadView } from './components/thread-view';

interface MailViewProps {
  folder: FolderType;
}

const MailView = ({ folder }: MailViewProps) => {
  const { translate } = useTranslationContext();
  const [activeMailId, setActiveMailId] = useState<string | undefined>(undefined);
  const [updateReadStatus] = useUpdateReadStatusMutation();
  const [moveToFolder] = useMoveToFolderMutation();
  const [deleteEmails] = useDeleteMailsMutation();
  const { openDialog } = useActionDialog();

  const { data: activeMailData } = useGetThreadQuery({ emailId: activeMailId! }, { skip: !activeMailId });
  const thread = activeMailId ? activeMailData : undefined;
  const activeMail = thread?.find((m) => m.id === activeMailId);
  const {
    isLoadingListFolder,
    listFolderEmails,
    hasMoreEmails,
    isUnreadFilter,
    listEmailsCount,
    onLoadMore,
    toggleUnreadFilter,
  } = useListFolderPaginated(folder);

  const { selectedEmails, selectAll, selectNone, selectRead, selectUnread, toggleSelectAll } =
    useMailSelection(listFolderEmails);
  const { listActionContext, bulkActionContext } = useListActionContext(folder, selectedEmails, {
    selectAll,
    selectNone,
    selectRead,
    selectUnread,
    deleteEmails: (emailIds) => deleteEmails({ emailIds, sourceMailbox: folder }).unwrap(),
    moveToFolder: (args) => moveToFolder(args).unwrap(),
  });
  const previewActions = usePreviewMailActions({
    activeMailId,
    folder,
    decryptedMail: activeMail,
    clearActiveMail: () => setActiveMailId(undefined),

    updateReadStatus: async (args) => {
      await updateReadStatus(args).unwrap();
    },
    moveToFolder: async (args) => {
      await moveToFolder(args).unwrap();
    },
    deleteEmails: async (args) => {
      await deleteEmails(args).unwrap();
    },
    openDialog,
  });
  const { unreadByMailbox } = useUnreadByMailbox();

  const folderName = translate(`mail.${folder}`);

  const onSelectEmail = async (id: string, isRead?: boolean) => {
    setActiveMailId(id);

    if (isRead) return;

    try {
      await updateReadStatus({
        emailId: id,
        mailbox: folder,
        isRead: true,
      });
    } catch (error) {
      const err = ErrorService.instance.castError(error);
      console.error(`Error while marking as read the email ${id}: `, err);
    }
  };

  const decryptedPreviews = useDecryptedPreviews(listFolderEmails);
  const formattedMails = formatEmailsToList(listFolderEmails, decryptedPreviews) ?? [];

  return (
    <div className="flex flex-row w-full h-full overflow-hidden">
      {/* Tray */}
      <div className="flex flex-col border-r border-gray-5 h-full">
        <div className="flex z-10">
          <TrayHeader
            folderName={folderName}
            listActionContext={listActionContext}
            bulkActionContext={bulkActionContext}
            isUnreadFilter={isUnreadFilter}
            selectedCount={selectedEmails.length}
            totalCount={listFolderEmails?.length ?? 0}
            onCheckboxClicked={toggleSelectAll}
            onToggleUnreadFilter={folder === 'sent' ? undefined : toggleUnreadFilter}
            onSearchEmailSelected={onSelectEmail}
          />
        </div>
        <div className="flex-1 w-full overflow-hidden">
          <Tray
            loading={isLoadingListFolder}
            mails={formattedMails}
            activeEmail={activeMailId}
            selectedEmails={selectedEmails}
            hasMoreItems={hasMoreEmails}
            onLoadMore={onLoadMore}
            emptyState={<TrayEmptyState folderName={folderName} />}
            onMailSelected={onSelectEmail}
          />
        </div>
      </div>
      {/* Mail Preview */}
      <div className="flex flex-col w-full">
        <div className="flex flex-row w-full pl-1 justify-between">
          <ActionsBar isRead={activeMail?.isRead ?? false} optionsDisabled={!activeMailId} {...previewActions} />
          <Settings />
        </div>

        <Activity mode={!activeMailId && !!listEmailsCount ? 'visible' : 'hidden'}>
          <PreviewEmailEmptyState unreadEmailsCount={unreadByMailbox[folder]} />
        </Activity>

        {thread && <ThreadView key={activeMailId} thread={thread} />}
      </div>
    </div>
  );
};

export default MailView;
