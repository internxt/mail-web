import { useTranslationContext } from '@/i18n';
import Header from './components/header';
import { Tray } from '@internxt/ui';
import { TrayEmptyState } from './components/trayEmptyState';
import type { FolderType } from '@/types/mail';

interface MailViewProps {
  folder: FolderType;
}

const MailView = ({ folder }: MailViewProps) => {
  const { translate } = useTranslationContext();

  const folderName = translate(`mail.${folder}`);

  return (
    <div className="flex flex-row w-full h-full">
      <div className="flex flex-col border-r border-gray-5 h-full">
        <div className="flex z-10">
          <Header folderName={folderName} />
        </div>
        <div className="flex-1 w-full overflow-hidden">
          <Tray loading={true} mails={[]} emptyState={<TrayEmptyState folderName={folderName} />} />
        </div>
      </div>
    </div>
  );
};

export default MailView;
