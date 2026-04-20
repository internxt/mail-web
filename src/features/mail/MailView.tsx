import { Activity, useState } from 'react';
import { useTranslationContext } from '@/i18n';
import type { FolderType } from '@/types/mail';
import PreviewMail from './components/mail-preview';
import TrayList from './components/tray';
import Settings from './components/settings';
import { useGetMailMessageQuery, useMarkAsReadMutation } from '@/store/api/mail';
import { DateService } from '@/services/date';
import { ErrorService } from '@/services/error';
import useListFolderPaginated from '@/hooks/mail/useListFolderPaginated';
import { useUnreadByMailbox } from '@/hooks/mail/useUnreadByMailbox';
import PreviewEmailEmptyState from './components/mail-preview/preview-empty-state';

interface MailViewProps {
  folder: FolderType;
}

const MailView = ({ folder }: MailViewProps) => {
  const { translate } = useTranslationContext();
  const [activeMailId, setActiveMailId] = useState<string | undefined>(undefined);

  const { isLoadingListFolder, listFolderEmails, hasMoreEmails, onLoadMore } = useListFolderPaginated(folder);
  const { unreadByMailbox } = useUnreadByMailbox();

  const listEmailsCount = listFolderEmails?.length;

  const { data: activeMail } = useGetMailMessageQuery({ emailId: activeMailId! }, { skip: !activeMailId });
  const [markAsRead] = useMarkAsReadMutation();

  const folderName = translate(`mail.${folder}`);

  const from = activeMail?.from[0];
  const to = activeMail?.to ?? [];
  const cc = activeMail?.cc ?? [];
  const bcc = activeMail?.bcc ?? [];

  const onSelectEmail = async (id: string, isRead?: boolean) => {
    setActiveMailId(id);

    if (isRead) return;

    try {
      await markAsRead({
        emailId: id,
        mailbox: folder,
      });
    } catch (error) {
      const err = ErrorService.instance.castError(error);
      console.error(`Error while marking as read the email ${id}: `, err);
    }
  };

  return (
    <div className="flex flex-row w-full h-full">
      {/* Tray */}
      <TrayList
        folderName={folderName}
        listFolder={listFolderEmails}
        isLoadingListFolder={isLoadingListFolder}
        activeMailId={activeMailId}
        onMailSelected={onSelectEmail}
        loadMore={onLoadMore}
        hasMoreItems={hasMoreEmails}
      />
      {/* Mail Preview */}
      <div className="flex flex-col w-full">
        <div className="flex w-full justify-end">
          <Settings />
        </div>

        <Activity mode={!activeMail && listEmailsCount ? 'visible' : 'hidden'}>
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
              receivedAt: DateService.formatWithTime(activeMail.receivedAt),
              htmlBody: activeMail.htmlBody ?? '',
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MailView;
