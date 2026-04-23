import { Tray } from '@internxt/ui';
import type { EmailListResponse } from '@internxt/sdk';
import Header from './header';
import { TrayEmptyState } from './tray-empty-state';
import { DateService } from '@/services/date';

interface TrayListProps {
  folderName: string;
  listFolder: EmailListResponse['emails'] | undefined;
  isLoadingListFolder: boolean;
  activeMailId?: string;
  hasMoreItems?: boolean;
  loadMore?: () => void;
  onMailSelected?: (id: string, isRead?: boolean) => void;
}

const TrayList = ({
  folderName,
  listFolder,
  isLoadingListFolder,
  activeMailId,
  hasMoreItems,
  loadMore,
  onMailSelected,
}: TrayListProps) => {
  const formattedMails =
    listFolder?.map((mail) => ({
      id: mail.id,
      from: {
        name: mail.from[0]?.name ?? mail.from[0]?.email ?? '',
        avatar: '',
      },
      subject: mail.subject,
      createdAt: DateService.formatMailTimestamp(mail.receivedAt),
      body: mail.preview,
      read: mail.isRead,
    })) ?? [];

  return (
    <div className="flex flex-col border-r border-gray-5 h-full">
      <div className="flex z-10">
        <Header folderName={folderName} onSearchEmailSelected={onMailSelected ?? (() => {})} />
      </div>
      <div className="flex-1 w-full overflow-hidden">
        <Tray
          loading={isLoadingListFolder}
          mails={formattedMails}
          activeEmail={activeMailId}
          hasMoreItems={hasMoreItems}
          onLoadMore={loadMore}
          emptyState={<TrayEmptyState folderName={folderName} />}
          onMailSelected={onMailSelected}
        />
      </div>
    </div>
  );
};

export default TrayList;
