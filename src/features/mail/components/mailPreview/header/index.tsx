import UserChip from '@/components/UserChip';
import { DateService } from '@/services/date';
import { Avatar } from '@internxt/ui';
import { PaperclipIcon } from '@phosphor-icons/react';

export interface User {
  email: string;
  name: string;
  avatar?: string;
}

interface HeaderProps {
  sender: User;
  date: string;
  to: User[];
  cc: User[];
  bcc: User[];
  attachmentsLength?: number;
}

const RecipientLine = ({ label, users }: { label: string; users: User[] }) => {
  if (users.length === 0) return null;

  return (
    <span className="flex flex-row items-center gap-1 text-sm font-medium text-gray-100">
      {label}
      <span className="flex flex-row flex-wrap gap-1">
        {users.map((user) => (
          <UserChip key={user.email} avatar={user.avatar} name={user.name} email={user.email} />
        ))}
      </span>
    </span>
  );
};

const PreviewHeader = ({ sender, date, to, cc, bcc, attachmentsLength }: HeaderProps) => {
  const formattedDate = DateService.formatWithTime(date);

  return (
    <div className="flex w-full flex-row items-start justify-between p-5">
      <div className="flex flex-row gap-3">
        <Avatar fullName={sender.name} src={sender.avatar} diameter={40} />
        <div className="flex flex-col gap-0.5">
          <p className="text-lg font-medium text-gray-100">{sender.name}</p>
          <div className="flex flex-col gap-2">
            <RecipientLine label="To:" users={to} />
            <RecipientLine label="CC:" users={cc} />
            <RecipientLine label="BCC:" users={bcc} />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-3 text-sm text-gray-500">
        <span className="whitespace-nowrap text-sm text-gray-80">{formattedDate}</span>
        {attachmentsLength && attachmentsLength > 0 ? (
          <span className="flex flex-row items-center gap-1">
            <PaperclipIcon size={16} />
            {attachmentsLength}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default PreviewHeader;
