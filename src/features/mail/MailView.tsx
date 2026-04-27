import { Activity, useState } from 'react';
import { useTranslationContext } from '@/i18n';
import type { FolderType } from '@/types/mail';
import PreviewMail from './components/mail-preview';
import Settings from './components/settings';
import {
  useDeleteMailsMutation,
  useGetMailMessageQuery,
  useMoveToFolderMutation,
  useUpdateReadStatusMutation,
} from '@/store/api/mail';
import { ErrorService } from '@/services/error';
import useListFolderPaginated from '@/hooks/mail/useListFolderPaginated';
import { useUnreadByMailbox } from '@/hooks/mail/useUnreadByMailbox';
import { useMailSelection } from '@/hooks/mail/useMailSelection';
import PreviewEmailEmptyState from './components/mail-preview/preview-empty-state';
import TrayHeader from './components/tray/header';
import { Tray } from '@internxt/ui';
import { TrayEmptyState } from './components/tray/tray-empty-state';
import { formatEmailsToList } from '@/utils/format-emails';
import { useListActionContext } from '@/hooks/mail/useListActionContext';
import { usePreviewMailActions } from '@/hooks/mail/usePreviewMailActions';
import ActionsBar from './components/mail-preview/actions-bar';

interface MailViewProps {
  folder: FolderType;
}

const MailView = ({ folder }: MailViewProps) => {
  const { translate } = useTranslationContext();
  const [activeMailId, setActiveMailId] = useState<string | undefined>(undefined);
  const [updateReadStatus] = useUpdateReadStatusMutation();
  const [moveToFolder] = useMoveToFolderMutation();
  const [deleteEmails] = useDeleteMailsMutation();

  const { data: activeMailData } = useGetMailMessageQuery({ emailId: activeMailId! }, { skip: !activeMailId });
  const activeMail = activeMailId ? activeMailData : undefined;
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
  });
  const previewActions = usePreviewMailActions({
    activeMailId,
    folder,
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
  });
  const { unreadByMailbox } = useUnreadByMailbox();

  const folderName = translate(`mail.${folder}`);

  const from = activeMail?.from[0];
  const to = activeMail?.to ?? [];
  const cc = activeMail?.cc ?? [];
  const bcc = activeMail?.bcc ?? [];

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

  const formattedMails = formatEmailsToList(listFolderEmails) ?? [];

  return (
    <div className="flex flex-row w-full h-full">
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

        {activeMail && from && (
          <PreviewMail
            from={{ name: from.name ?? '', email: from.email }}
            to={to.map((u) => ({ name: u.name ?? '', email: u.email }))}
            cc={cc.map((u) => ({ name: u.name ?? '', email: u.email }))}
            bcc={bcc.map((u) => ({ name: u.name ?? '', email: u.email }))}
            mail={{
              subject: activeMail.subject,
              receivedAt: activeMail.receivedAt,
              htmlBody: activeMail.htmlBody ?? '',
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MailView;
