import { useTranslationContext } from '@/i18n';
import {
  ArrowBendDoubleUpLeftIcon,
  ArrowBendUpLeftIcon,
  ArrowBendUpRightIcon,
  EnvelopeOpenIcon,
  TrashIcon,
  TrayIcon,
  WarningOctagonIcon,
} from '@phosphor-icons/react';
import MoveTo from '@/assets/icons/move-to.svg?react';
import { Dropdown } from '@internxt/ui';
import type { MenuItemsType } from '@internxt/ui/dist/components/menu/Menu';
import { isCurrentPath } from '@/utils/current-path';
import { useLocation } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import type { FolderType } from '@/types/mail';

interface ActionsBarProps {
  isRead: boolean;
  optionsDisabled: boolean;
  onMarkAsRead: () => void;
  onMarkAsUnread: () => void;
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
  onMove: (folder: FolderType) => Promise<null> | void;
  onTrash: () => Promise<null> | void;
}

const Separator = () => <div className="h-5 w-px bg-gray-10" />;

const ActionsBar = ({
  isRead,
  optionsDisabled,
  onMarkAsRead,
  onMarkAsUnread,
  onTrash,
  onMove,
  onReply,
  onReplyAll,
  onForward,
}: ActionsBarProps) => {
  const { translate } = useTranslationContext();
  const { pathname } = useLocation();

  const iconButtonClass =
    'flex items-center justify-center rounded-lg p-2 text-gray-60 transition-colors hover:bg-gray-5 hover:text-gray-80 disabled:pointer-events-none disabled:opacity-40';

  const isActive = useCallback((path: string) => isCurrentPath(path, pathname), [pathname]);

  const moveToItems: MenuItemsType<unknown> = useMemo(
    () => [
      {
        disabled: () => isActive('/inbox') || optionsDisabled,
        name: translate('mail.inbox'),
        icon: TrayIcon,
        onClick: () => onMove('inbox'),
      },
      {
        disabled: () => isActive('/spam') || optionsDisabled,
        name: translate('mail.spam'),
        icon: WarningOctagonIcon,
        onClick: () => onMove('spam'),
      },
      {
        disabled: () => isActive('/trash') || optionsDisabled,
        name: translate('mail.trash'),
        icon: TrashIcon,
        onClick: () => onMove('trash'),
      },
    ],
    [optionsDisabled, isActive, onMove, translate],
  );

  return (
    <div className="flex items-center z-30 gap-5 pl-4">
      <button
        disabled={optionsDisabled}
        type="button"
        title={isRead ? translate('actions.markAsUnread') : translate('actions.markAsRead')}
        className={iconButtonClass}
        onClick={isRead ? onMarkAsUnread : onMarkAsRead}
      >
        <EnvelopeOpenIcon size={24} />
      </button>

      <div className="flex flex-row gap-1 items-center">
        <button
          disabled={optionsDisabled}
          type="button"
          title={translate('actions.trashEmail')}
          className={iconButtonClass}
          onClick={onTrash}
        >
          <TrashIcon size={24} />
        </button>
        <Separator />
        <Dropdown
          classButton={iconButtonClass}
          dropdownActionsContext={moveToItems}
          openDirection="left"
          classMenuItems="max-w-[224px] w-screen"
        >
          <MoveTo />
        </Dropdown>
      </div>

      <div className="flex flex-row items-center gap-1">
        <button
          disabled={optionsDisabled}
          type="button"
          title={translate('actions.reply')}
          className={iconButtonClass}
          onClick={onReply}
        >
          <ArrowBendUpLeftIcon size={24} />
        </button>
        <Separator />
        <button
          disabled={optionsDisabled}
          type="button"
          title={translate('actions.replyAll')}
          className={iconButtonClass}
          onClick={onReplyAll}
        >
          <ArrowBendDoubleUpLeftIcon size={24} />
        </button>
        <Separator />
        <button
          disabled={optionsDisabled}
          type="button"
          title={translate('actions.forward')}
          className={iconButtonClass}
          onClick={onForward}
        >
          <ArrowBendUpRightIcon size={24} />
        </button>
      </div>
    </div>
  );
};

export default ActionsBar;
