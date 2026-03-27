import { useState } from 'react';
import { useTranslationContext } from '@/i18n';
import type { FolderType } from '@/types/mail';
import PreviewMail from './components/mail-preview';
import TrayList from './components/tray';
import Settings from './components/settings';
import { useGetListFolderQuery, useGetMailMessageQuery, useMarkAsReadMutation } from '@/store/api/mail';
import { DateService } from '@/services/date';
import { DEFAULT_FOLDER_LIMIT } from '@/constants';
import { ErrorService } from '@/services/error';

interface MailViewProps {
  folder: FolderType;
}

const MailView = ({ folder }: MailViewProps) => {
  const { translate } = useTranslationContext();
  const [activeMailId, setActiveMailId] = useState<string | undefined>(undefined);
  const query = {
    mailbox: folder,
    limit: DEFAULT_FOLDER_LIMIT,
    position: 0,
  };

  const { data: listFolder, isLoading: isLoadingListFolder } = useGetListFolderQuery(query, {
    pollingInterval: 30000,
    skip: !folder,
  });
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
        query,
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
        listFolder={listFolder?.emails}
        isLoadingListFolder={isLoadingListFolder}
        activeMailId={activeMailId}
        onMailSelected={onSelectEmail}
      />
      {/* Mail Preview */}
      <div className="flex flex-col w-full">
        <div className="flex w-full justify-end">
          <Settings />
        </div>
        {activeMail && from ? (
          <PreviewMail
            from={{ name: from.name ?? '', email: from.email }}
            to={to.map((u) => ({ name: u.name ?? '', email: u.email }))}
            cc={cc.map((u) => ({ name: u.name ?? '', email: u.email }))}
            bcc={bcc.map((u) => ({ name: u.name ?? '', email: u.email }))}
            mail={{
              subject: activeMail.subject,
              receivedAt: DateService.formatWithTime(activeMail.receivedAt),
              htmlBody: (activeMail.htmlBody as string | null) ?? '',
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

export default MailView;
