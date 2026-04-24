import { useTranslationContext } from '@/i18n';
import type { FolderType } from '@/types/mail';
import { type MenuItemType } from '@internxt/ui';
import { TrashIcon } from '@phosphor-icons/react';

interface UseListActionContextParams {
  selectAll: () => void;
  selectNone: () => void;
  selectRead: () => void;
  selectUnread: () => void;
  applyUnreadFilter: (value: boolean | undefined) => void;
}

interface UseListActionContextResult {
  listActionContext: MenuItemType<unknown>[];
  bulkActionContext: MenuItemType<unknown>[];
}

export const useListActionContext = (
  folder: FolderType,
  { selectAll, selectNone, selectRead, selectUnread, applyUnreadFilter }: UseListActionContextParams,
): UseListActionContextResult => {
  const { translate } = useTranslationContext();

  const baseSelectionActions: MenuItemType<unknown>[] = [
    {
      name: translate('filter.all'),
      action: () => {
        selectAll();
        applyUnreadFilter(undefined);
      },
    },
    {
      name: translate('filter.none'),
      action: () => {
        selectNone();
        applyUnreadFilter(undefined);
      },
    },
  ];

  const inboxSelectionActions: MenuItemType<unknown>[] = [
    ...baseSelectionActions,
    {
      name: translate('filter.read'),
      action: () => {
        selectRead();
        applyUnreadFilter(false);
      },
    },
    {
      name: translate('filter.unread'),
      action: () => {
        selectUnread();
        applyUnreadFilter(true);
      },
    },
  ];

  const trashBulkAction: MenuItemType<unknown> = {
    name: translate('actions.trashAll'),
    action: () => {},
    icon: TrashIcon,
  };

  const emptyTrashBulkAction: MenuItemType<unknown> = {
    name: translate('actions.emptyTrash'),
    action: () => {},
    icon: TrashIcon,
  };

  switch (folder) {
    case 'inbox':
    case 'spam':
      return { listActionContext: inboxSelectionActions, bulkActionContext: [trashBulkAction] };
    case 'sent':
      return { listActionContext: baseSelectionActions, bulkActionContext: [] };
    case 'drafts':
      return { listActionContext: baseSelectionActions, bulkActionContext: [trashBulkAction] };
    case 'trash':
      return { listActionContext: baseSelectionActions, bulkActionContext: [emptyTrashBulkAction] };
  }
};
