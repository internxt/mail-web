import { useCallback, useMemo } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { TrashIcon, TrayIcon, PaperPlaneTiltIcon, FileIcon, WarningOctagonIcon } from '@phosphor-icons/react';
import type { SidenavOption } from '@internxt/ui';
import { useTranslationContext } from '@/i18n';
import { AUTO_POLLING_INTERVAL_IN_MILLISECONDS } from '@/constants';
import { AppView } from '@/routes/paths';
import { NavigationService } from '@/services/navigation';
import { useUnreadByMailbox } from '@/hooks/mail/useUnreadByMailbox';
import { mailApi } from '@/store/api/mail';
import { useAppDispatch } from '@/store/hooks';
import type { FolderType } from '@/types/mail';

export const useSidenavNavigation = () => {
  const { translate } = useTranslationContext();
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();
  const { unreadByMailbox, refetch } = useUnreadByMailbox({
    pollingInterval: AUTO_POLLING_INTERVAL_IN_MILLISECONDS,
    skipPollingIfUnfocused: true,
    refetchOnFocus: true,
  });

  const isActiveButton = useCallback((path: string) => !!matchPath(path, pathname), [pathname]);

  const onSidenavItemClick = useCallback((path: AppView) => {
    NavigationService.instance.navigate({ id: path });
  }, []);

  const refreshMailbox = useCallback(
    (mailbox: FolderType) => {
      dispatch(mailApi.util.invalidateTags([{ type: 'ListFolder', id: mailbox }]));
      void refetch();
    },
    [dispatch, refetch],
  );

  const itemsNavigation: SidenavOption[] = useMemo(
    () => [
      {
        isActive: isActiveButton('/inbox'),
        label: translate('mail.inbox'),
        icon: TrayIcon,
        iconDataCy: 'sideNavInboxIcon',
        isVisible: true,
        notifications: unreadByMailbox['inbox'],
        onClick: () => onSidenavItemClick(AppView.Inbox),
        onRefresh: () => refreshMailbox('inbox'),
      },
      {
        isActive: isActiveButton('/drafts'),
        label: translate('mail.drafts'),
        icon: FileIcon,
        iconDataCy: 'sideNavDraftsIcon',
        isVisible: true,
        notifications: unreadByMailbox['drafts'],
        onClick: () => onSidenavItemClick(AppView.Drafts),
        onRefresh: () => refreshMailbox('drafts'),
      },
      {
        isActive: isActiveButton('/sent'),
        label: translate('mail.sent'),
        icon: PaperPlaneTiltIcon,
        iconDataCy: 'sideNavSentIcon',
        isVisible: true,
        notifications: unreadByMailbox['sent'],
        onClick: () => onSidenavItemClick(AppView.Sent),
        onRefresh: () => refreshMailbox('sent'),
      },
      {
        isActive: isActiveButton('/spam'),
        label: translate('mail.spam'),
        icon: WarningOctagonIcon,
        iconDataCy: 'sideNavSpamIcon',
        isVisible: true,
        notifications: unreadByMailbox['spam'],
        onClick: () => onSidenavItemClick(AppView.Spam),
        onRefresh: () => refreshMailbox('spam'),
      },
      {
        isActive: isActiveButton('/trash'),
        label: translate('mail.trash'),
        icon: TrashIcon,
        iconDataCy: 'sideNavTrashIcon',
        isVisible: true,
        notifications: unreadByMailbox['trash'],
        onClick: () => onSidenavItemClick(AppView.Trash),
        onRefresh: () => refreshMailbox('trash'),
      },
    ],
    [unreadByMailbox, refreshMailbox, translate, onSidenavItemClick, isActiveButton],
  );

  return { itemsNavigation };
};
