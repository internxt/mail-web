import { useTranslationContext } from '@/i18n';
import type { TranslationKey } from '@/i18n/types';
import notificationsService, { ToastType } from '@/services/notifications';
import type { FolderType } from '@/types/mail';
import { type MenuItemType } from '@internxt/ui';
import { ArchiveIcon, TrashIcon, TrayIcon, WarningOctagonIcon } from '@phosphor-icons/react';
import { useCallback, useMemo } from 'react';

type SourceGroup = { emailIds: string[]; sourceMailbox: FolderType };

type MoveTarget = Exclude<FolderType, 'sent' | 'drafts'>;

interface UseListActionContextParams {
  selectAll: () => void;
  selectNone: () => void;
  selectRead: () => void;
  selectUnread: () => void;
  deleteEmails: (emailIds: string[]) => Promise<void | null>;
  moveToFolder: (args: {
    emailIds: string[];
    sourceMailbox: FolderType;
    targetMailbox: FolderType;
  }) => Promise<void | null>;
}

interface UseListActionContextResult {
  listActionContext: MenuItemType<unknown>[];
  bulkActionContext: MenuItemType<unknown>[];
}

const MOVE_TARGETS_BY_SOURCE: Record<FolderType, MoveTarget[]> = {
  inbox: ['archive', 'spam', 'trash'],
  spam: ['inbox', 'archive', 'trash'],
  drafts: ['trash'],
  archive: ['inbox', 'spam', 'trash'],
  sent: [],
  trash: [],
};

const TARGET_META: Record<MoveTarget, { label: TranslationKey; folderName: TranslationKey; icon: typeof TrayIcon }> = {
  inbox: { label: 'actions.moveAllToInbox', folderName: 'mail.inbox', icon: TrayIcon },
  archive: { label: 'actions.moveAllToArchive', folderName: 'mail.archive', icon: ArchiveIcon },
  spam: { label: 'actions.moveAllToSpam', folderName: 'mail.spam', icon: WarningOctagonIcon },
  trash: { label: 'actions.moveAllToTrash', folderName: 'mail.trash', icon: TrashIcon },
};

const NO_BULK_ACTIONS: MenuItemType<unknown>[] = [];

export const useListActionContext = (
  folder: FolderType,
  selectedMails: string[],
  { selectAll, selectNone, selectRead, selectUnread, deleteEmails, moveToFolder }: UseListActionContextParams,
): UseListActionContextResult => {
  const { translate } = useTranslationContext();
  const selectedCount = selectedMails.length;
  const isSelectionEmpty = useCallback(() => selectedCount === 0, [selectedCount]);

  const baseSelectionActions = useMemo<MenuItemType<unknown>[]>(
    () => [
      { name: translate('filter.all'), action: selectAll },
      { name: translate('filter.none'), action: selectNone },
    ],
    [translate, selectAll, selectNone],
  );

  const inboxSelectionActions = useMemo<MenuItemType<unknown>[]>(
    () => [
      ...baseSelectionActions,
      { name: translate('filter.read'), action: selectRead },
      { name: translate('filter.unread'), action: selectUnread },
    ],
    [baseSelectionActions, translate, selectRead, selectUnread],
  );

  const showMovedToast = useCallback(
    (groups: SourceGroup[], target: MoveTarget) => {
      const totalCount = groups.reduce((acc, g) => acc + g.emailIds.length, 0);
      const folderName = translate(TARGET_META[target].folderName);
      const text =
        totalCount === 1
          ? translate('toastNotification.movedToFolder_one', { folder: folderName })
          : translate('toastNotification.movedToFolder_many', { count: totalCount, folder: folderName });
      notificationsService.show({
        text,
        type: ToastType.Success,
        action: {
          text: translate('toastNotification.undo'),
          onClick: () => {
            groups.forEach((g) => {
              moveToFolder({
                emailIds: g.emailIds,
                sourceMailbox: target,
                targetMailbox: g.sourceMailbox,
              }).catch(() => undefined);
            });
          },
        },
      });
    },
    [translate, moveToFolder],
  );

  const performBulkMove = useCallback(
    async (target: MoveTarget) => {
      const ids = [...selectedMails];
      if (ids.length === 0) return;
      const groups: SourceGroup[] = [{ emailIds: ids, sourceMailbox: folder }];
      try {
        if (target === 'trash') {
          await deleteEmails(ids);
        } else {
          await moveToFolder({ emailIds: ids, sourceMailbox: folder, targetMailbox: target });
        }
        showMovedToast(groups, target);
      } catch {
        // empty
      } finally {
        selectNone();
      }
    },
    [selectedMails, folder, deleteEmails, moveToFolder, selectNone, showMovedToast],
  );

  const moveBulkActions = useMemo<MenuItemType<unknown>[]>(
    () =>
      MOVE_TARGETS_BY_SOURCE[folder].map((target) => ({
        name: translate(TARGET_META[target].label),
        icon: TARGET_META[target].icon,
        disabled: isSelectionEmpty,
        action: () => performBulkMove(target),
      })),
    [folder, translate, isSelectionEmpty, performBulkMove],
  );

  const emptyTrashBulkAction = useMemo<MenuItemType<unknown>>(
    () => ({
      name: translate('actions.emptyTrash'),
      action: async () => {
        await deleteEmails(selectedMails);
        selectNone();
      },
      icon: TrashIcon,
      disabled: isSelectionEmpty,
    }),
    [translate, deleteEmails, selectedMails, selectNone, isSelectionEmpty],
  );

  const emptyTrashBulkActions = useMemo(() => [emptyTrashBulkAction], [emptyTrashBulkAction]);

  switch (folder) {
    case 'inbox':
    case 'spam':
    case 'archive':
      return { listActionContext: inboxSelectionActions, bulkActionContext: moveBulkActions };
    case 'sent':
      return { listActionContext: baseSelectionActions, bulkActionContext: NO_BULK_ACTIONS };
    case 'drafts':
      return { listActionContext: baseSelectionActions, bulkActionContext: moveBulkActions };
    case 'trash':
      return { listActionContext: baseSelectionActions, bulkActionContext: emptyTrashBulkActions };
  }
};
