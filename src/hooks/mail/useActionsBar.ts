import { useTranslationContext } from '@/i18n';
import { isCurrentPath } from '@/utils/current-path';
import { useLocation } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import type { FolderType } from '@/types/mail';
import { TrayIcon, WarningOctagonIcon, TrashIcon } from '@phosphor-icons/react';
import type { MenuItemType } from '@internxt/ui';

interface UseActionsBarParams {
  isRead: boolean;
  optionsDisabled: boolean;
  onMarkAsRead: () => void;
  onMarkAsUnread: () => void;
  onMove: (folder: FolderType) => Promise<null> | void;
  onTrash: () => Promise<null> | void;
}

export const useActionsBar = ({
  isRead,
  optionsDisabled,
  onMarkAsRead,
  onMarkAsUnread,
  onMove,
  onTrash,
}: UseActionsBarParams) => {
  const { translate } = useTranslationContext();
  const { pathname } = useLocation();

  const isActive = useCallback((path: string) => isCurrentPath(path, pathname), [pathname]);

  const moveToItems: MenuItemType<unknown>[] = useMemo(
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

  const toggleReadTitle = isRead ? translate('actions.markAsUnread') : translate('actions.markAsRead');
  const onToggleRead = isRead ? onMarkAsUnread : onMarkAsRead;

  return {
    translate,
    moveToItems,
    toggleReadTitle,
    onToggleRead,
    onTrash,
  };
};
