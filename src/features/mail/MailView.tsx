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
import { useBulkMailActions } from '@/hooks/mail/useBulkMailActions';
import ActionsBar from './components/mail-preview/actions-bar';
import { useActionDialog } from '@/context/dialog-manager';
import { ThreadView } from './components/thread-view';
import { useOpenDraftInCompose } from '@/hooks/mail/useOpenDraftInCompose';

interface MailViewProps {
  folder: FolderType;
}

const MailView = ({ folder }: MailViewProps) => {
  const { translate } = useTranslationContext();
  const [activeMailId, setActiveMailId] = useState<string | undefined>(undefined);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [renderedFolder, setRenderedFolder] = useState(folder);
  if (renderedFolder !== folder) {
    setRenderedFolder(folder);
    setActiveMailId(undefined);
  }

  const [updateReadStatus] = useUpdateReadStatusMutation();
  const [moveToFolder] = useMoveToFolderMutation();
  const [deleteEmails] = useDeleteMailsMutation();
  const { openDialog } = useActionDialog();
  const openDraftInCompose = useOpenDraftInCompose();

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

  const { selectedEmails, selectAll, selectEmail, selectNone, selectRead, selectUnread, toggleSelectAll } =
    useMailSelection(listFolderEmails);
  const { listActionContext, bulkActionContext } = useListActionContext(folder, selectedEmails, {
    selectAll,
    selectNone,
    selectRead,
    selectUnread,
    deleteEmails: (emailIds) => deleteEmails({ emailIds, sourceMailbox: folder }).unwrap(),
    moveToFolder: (args) => moveToFolder(args).unwrap(),
    openDialog,
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
  const bulkActions = useBulkMailActions({
    folder,
    selectedEmails,
    listFolderEmails,
    clearSelection: selectNone,
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

  const hasSelection = selectedEmails.length > 0;
  const actionsBarProps = hasSelection
    ? {
        ...previewActions,
        ...bulkActions,
        isRead: bulkActions.areAllSelectedRead,
        optionsDisabled: false,
        replyOptionsDisabled: selectedEmails.length > 1 || !activeMailId,
      }
    : {
        ...previewActions,
        isRead: activeMail?.isRead ?? false,
        optionsDisabled: !activeMailId,
      };

  const folderName = translate(`mail.${folder}`);

  const onSelectEmail = async (id: string, isRead?: boolean) => {
    if (folder === 'drafts') {
      await openDraftInCompose(id);
      return;
    }

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
            onSearchOpenChange={setIsSearchOpen}
          />
        </div>
        <div
          className={`flex-1 w-full overflow-hidden ${isSearchOpen ? 'pointer-events-none' : ''}`}
          inert={isSearchOpen}
        >
          <Tray
            loading={isLoadingListFolder}
            mails={formattedMails}
            activeEmail={activeMailId}
            selectedEmails={selectedEmails}
            hasMoreItems={hasMoreEmails}
            onLoadMore={onLoadMore}
            emptyState={<TrayEmptyState folderName={folderName} />}
            onMailSelected={onSelectEmail}
            onMailChecked={selectEmail}
          />
        </div>
      </div>
      {/* Mail Preview */}
      <div className={`flex flex-col w-full ${isSearchOpen ? 'pointer-events-none' : ''}`} inert={isSearchOpen}>
        <div className="flex flex-row w-full pl-1 justify-between">
          <ActionsBar {...actionsBarProps} />
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
