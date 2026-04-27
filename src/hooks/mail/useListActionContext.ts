import { useTranslationContext } from '@/i18n';
import type { FolderType } from '@/types/mail';
import { type MenuItemType } from '@internxt/ui';
import { TrashIcon } from '@phosphor-icons/react';

interface UseListActionContextParams {
  selectAll: () => void;
  selectNone: () => void;
  selectRead: () => void;
  selectUnread: () => void;
  deleteEmails: (emailIds: string[]) => Promise<void | null>;
}

interface UseListActionContextResult {
  listActionContext: MenuItemType<unknown>[];
  bulkActionContext: MenuItemType<unknown>[];
}

export const useListActionContext = (
  folder: FolderType,
  selectedMails: string[],
  { selectAll, selectNone, selectRead, selectUnread, deleteEmails }: UseListActionContextParams,
): UseListActionContextResult => {
  const { translate } = useTranslationContext();

  const baseSelectionActions: MenuItemType<unknown>[] = [
    { name: translate('filter.all'), action: selectAll },
    { name: translate('filter.none'), action: selectNone },
  ];

  const inboxSelectionActions: MenuItemType<unknown>[] = [
    ...baseSelectionActions,
    { name: translate('filter.read'), action: selectRead },
    { name: translate('filter.unread'), action: selectUnread },
  ];

  const trashBulkAction: MenuItemType<unknown> = {
    name: translate('actions.trashAll'),
    action: async () => {
      await deleteEmails(selectedMails);
      selectNone();
    },
    icon: TrashIcon,
    disabled: () => selectedMails.length === 0,
  };

  const emptyTrashBulkAction: MenuItemType<unknown> = {
    name: translate('actions.emptyTrash'),
    action: async () => {
      await deleteEmails(selectedMails);
      selectNone();
    },
    icon: TrashIcon,
    disabled: () => selectedMails.length === 0,
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
