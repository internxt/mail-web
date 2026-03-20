import { Tray } from '@internxt/ui';
import Header from './header';
import { TrayEmptyState } from './trayEmptyState';

interface TrayListProps {
  folderName: string;
}

const TrayList = ({ folderName }: TrayListProps) => {
  return (
    <div className="flex flex-col border-r border-gray-5 h-full">
      <div className="flex z-10">
        <Header folderName={folderName} />
      </div>
      <div className="flex-1 w-full overflow-hidden">
        <Tray loading={true} mails={[]} emptyState={<TrayEmptyState folderName={folderName} />} />
      </div>
    </div>
  );
};

export default TrayList;
