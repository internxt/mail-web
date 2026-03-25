import { useTranslationContext } from '@/i18n';
import type { UserSettings } from '@internxt/sdk/dist/shared/types/userSettings';
import { Avatar, Popover } from '@internxt/ui';
import { GearIcon, SignOutIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

interface AccountPopoverProps {
  className?: string;
  user: UserSettings;
  percentageUsed: number;
  onLogout: () => void;
  openPreferences: () => void;
}

export default function AccountPopover({
  className = '',
  user,
  percentageUsed,
  onLogout,
  openPreferences,
}: Readonly<AccountPopoverProps>) {
  const { translate } = useTranslationContext();
  const name = user?.name ?? '';
  const lastName = user?.lastname ?? '';
  const fullName = name + ' ' + lastName;

  const avatarWrapper = <Avatar diameter={36} style={{ minWidth: 36 }} fullName={fullName} src={user.avatar} />;

  const separator = <div className="border-translate mx-3 my-0.5 border-gray-10" />;

  const panel = (
    <div className="w-52">
      <div className="flex items-center p-3">
        {avatarWrapper}
        <div className="ml-2 min-w-0">
          <p className="truncate font-medium text-gray-80" title={fullName} style={{ lineHeight: 1 }}>
            {fullName}
          </p>
          <p className="truncate text-sm text-gray-50" title={user.email}>
            {user.email}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 pb-1">
        <p className="text-sm text-gray-50">{translate('accountPopover.spaceUsed', { space: percentageUsed })}</p>
      </div>
      {separator}
      <button
        className="flex w-full cursor-pointer items-center px-3 py-2 text-gray-80 no-underline hover:bg-gray-1 hover:text-gray-80 dark:hover:bg-gray-10"
        onClick={openPreferences}
      >
        <GearIcon size={20} />
        <p className="ml-3">{translate('accountPopover.settings')}</p>
      </button>
      <Item onClick={onLogout}>
        <SignOutIcon size={20} />
        <p className="ml-3 truncate" data-test="logout">
          {translate('accountPopover.logout')}
        </p>
      </Item>
    </div>
  );

  return (
    <Popover className={className} childrenButton={avatarWrapper} panel={() => panel} data-test="app-header-dropdown" />
  );
}

interface ItemProps {
  children: ReactNode;
  onClick: () => void;
}

function Item({ children, onClick }: Readonly<ItemProps>) {
  return (
    <button
      className="flex cursor-pointer items-center px-3 py-2 text-gray-80 hover:bg-gray-1 dark:hover:bg-gray-10"
      style={{ lineHeight: 1.25 }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
