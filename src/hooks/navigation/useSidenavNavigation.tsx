import { useCallback, useMemo } from 'react';
import { matchPath } from 'react-router-dom';
import { TrashIcon, TrayIcon, PaperPlaneTiltIcon, FileIcon } from '@phosphor-icons/react';
import type { SidenavOption } from '@internxt/ui/dist/components/sidenav/SidenavOptions';
import { useTranslationContext } from '@/i18n';
import { AppView } from '@/routes/paths';
import { NavigationService } from '@/services/navigation';

export const useSidenavNavigation = () => {
  const { translate } = useTranslationContext();
  const pathname = globalThis.location.pathname;

  const isActiveButton = useCallback((path: string) => !!matchPath(pathname, path), [pathname]);

  const onSidenavItemClick = useCallback(
    (path: AppView) => {
      NavigationService.instance.navigate({ id: path });
    },
    [NavigationService.instance],
  );

  const itemsNavigation: SidenavOption[] = useMemo(
    () => [
      {
        isActive: isActiveButton('/inbox'),
        label: translate('sidebar.inbox'),
        icon: TrayIcon,
        iconDataCy: 'sideNavInboxIcon',
        isVisible: true,
        onClick: () => onSidenavItemClick(AppView.Inbox),
      },
      {
        isActive: isActiveButton('/drafts'),
        label: translate('sidebar.drafts'),
        icon: PaperPlaneTiltIcon,
        iconDataCy: 'sideNavDraftsIcon',
        isVisible: true,
        onClick: () => onSidenavItemClick(AppView.Drafts),
      },
      {
        isActive: isActiveButton('/sent'),
        label: translate('sidebar.sent'),
        icon: FileIcon,
        iconDataCy: 'sideNavSentIcon',
        isVisible: true,
        onClick: () => onSidenavItemClick(AppView.Sent),
      },
      {
        isActive: isActiveButton('/trash'),
        label: translate('sidebar.trash'),
        icon: TrashIcon,
        iconDataCy: 'sideNavTrashIcon',
        isVisible: true,
        onClick: () => onSidenavItemClick(AppView.Trash),
      },
    ],
    [translate, onSidenavItemClick, isActiveButton],
  );

  return { itemsNavigation };
};
