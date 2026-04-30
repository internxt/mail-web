import { renderHook } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useListActionContext } from './useListActionContext';
import type { FolderType } from '@/types/mail';
import type { MenuItemType } from '@internxt/ui';

const getItems = (items: MenuItemType<unknown>[]) =>
  items.filter(
    (item): item is Extract<MenuItemType<unknown>, { name?: string }> => !('separator' in item && item.separator),
  );

vi.mock('@/i18n', () => ({
  useTranslationContext: () => ({
    translate: (key: string) => key,
  }),
}));

const showMock = vi.fn();
vi.mock('@/services/notifications', () => ({
  __esModule: true,
  default: {
    show: (...args: unknown[]) => showMock(...args),
  },
  ToastType: { Success: 'success', Error: 'error', Warning: 'warning', Info: 'info', Loading: 'loading' },
}));

const makeParams = () => ({
  selectAll: vi.fn(),
  selectNone: vi.fn(),
  selectRead: vi.fn(),
  selectUnread: vi.fn(),
  deleteEmails: vi.fn().mockResolvedValue(null),
  moveToFolder: vi.fn().mockResolvedValue(null),
});

const renderFor = (folder: FolderType, selectedMails: string[] = []) => {
  const params = makeParams();
  const { result } = renderHook(() => useListActionContext(folder, selectedMails, params));
  return { result, params };
};

const findByName = (items: ReturnType<typeof getItems>, name: string) => {
  const item = items.find((i) => i.name === name);
  if (!item) throw new Error(`Bulk item ${name} not found`);
  return item;
};

describe('List actions - custom hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('inbox', () => {
    test('When the folder is inbox, then it returns all four selection actions', () => {
      const { result } = renderFor('inbox');
      const names = getItems(result.current.listActionContext).map((a) => a.name);
      expect(names).toEqual(['filter.all', 'filter.none', 'filter.read', 'filter.unread']);
    });

    test('When the folder is inbox, then it offers move to archive, spam and trash', () => {
      const { result } = renderFor('inbox');
      const names = getItems(result.current.bulkActionContext).map((a) => a.name);
      expect(names).toEqual(['actions.moveAllToArchive', 'actions.moveAllToSpam', 'actions.moveAllToTrash']);
    });

    test('When move-to-trash is triggered from inbox, then deleteEmails is called with all selected ids', async () => {
      const ids = Array.from({ length: 25 }, (_, i) => `mail-${i}`);
      const { result, params } = renderFor('inbox', ids);
      const bulk = getItems(result.current.bulkActionContext);

      await findByName(bulk, 'actions.moveAllToTrash').action?.(undefined);

      expect(params.deleteEmails).toHaveBeenCalledOnce();
      expect(params.deleteEmails).toHaveBeenCalledWith(ids);
    });

    test('When move-to-archive is triggered from inbox, then moveToFolder is called with target archive', async () => {
      const ids = ['mail-1', 'mail-2'];
      const { result, params } = renderFor('inbox', ids);
      const bulk = getItems(result.current.bulkActionContext);

      await findByName(bulk, 'actions.moveAllToArchive').action?.(undefined);

      expect(params.moveToFolder).toHaveBeenCalledWith({
        emailIds: ids,
        sourceMailbox: 'inbox',
        targetMailbox: 'archive',
      });
    });

    test('When the "All" action is triggered, then it only selects all emails without filtering', () => {
      const { result, params } = renderFor('inbox');
      getItems(result.current.listActionContext)[0].action?.(undefined);
      expect(params.selectAll).toHaveBeenCalledOnce();
    });

    test('When the "None" action is triggered, then it only deselects all emails without filtering', () => {
      const { result, params } = renderFor('inbox');
      getItems(result.current.listActionContext)[1].action?.(undefined);
      expect(params.selectNone).toHaveBeenCalledOnce();
    });

    test('When the "Read" action is triggered, then it only selects read emails without filtering', () => {
      const { result, params } = renderFor('inbox');
      getItems(result.current.listActionContext)[2].action?.(undefined);
      expect(params.selectRead).toHaveBeenCalledOnce();
    });

    test('When the "Unread" action is triggered, then it only selects unread emails without filtering', () => {
      const { result, params } = renderFor('inbox');
      getItems(result.current.listActionContext)[3].action?.(undefined);
      expect(params.selectUnread).toHaveBeenCalledOnce();
    });

    test('When a bulk move completes, then it clears the selection', async () => {
      const ids = ['mail-1', 'mail-2'];
      const { result, params } = renderFor('inbox', ids);
      const bulk = getItems(result.current.bulkActionContext);
      await findByName(bulk, 'actions.moveAllToTrash').action?.(undefined);
      expect(params.selectNone).toHaveBeenCalledOnce();
    });

    test('When a bulk move completes, then it shows a toast with an undo action', async () => {
      const ids = ['mail-1', 'mail-2'];
      const { result } = renderFor('inbox', ids);
      const bulk = getItems(result.current.bulkActionContext);

      await findByName(bulk, 'actions.moveAllToTrash').action?.(undefined);

      expect(showMock).toHaveBeenCalledOnce();
      const arg = showMock.mock.calls[0][0];
      expect(arg.text).toBe('toastNotification.movedToFolder_many');
      expect(arg.action.text).toBe('toastNotification.undo');
      expect(typeof arg.action.onClick).toBe('function');
    });

    test('When a single conversation is bulk-moved, then the singular toast key is used', async () => {
      const { result } = renderFor('inbox', ['mail-1']);
      const bulk = getItems(result.current.bulkActionContext);

      await findByName(bulk, 'actions.moveAllToTrash').action?.(undefined);

      expect(showMock.mock.calls[0][0].text).toBe('toastNotification.movedToFolder_one');
    });

    test('When the toast undo is triggered, then it moves emails back from the target folder to each source group', async () => {
      const ids = ['mail-1', 'mail-2'];
      const { result, params } = renderFor('inbox', ids);
      const bulk = getItems(result.current.bulkActionContext);

      await findByName(bulk, 'actions.moveAllToSpam').action?.(undefined);
      const arg = showMock.mock.calls[0][0];
      params.moveToFolder.mockClear();
      arg.action.onClick();

      expect(params.moveToFolder).toHaveBeenCalledWith({
        emailIds: ids,
        sourceMailbox: 'spam',
        targetMailbox: 'inbox',
      });
    });

    test('When move-to-trash undo fires, then emails are moved back from trash to the original folder', async () => {
      const ids = ['mail-1'];
      const { result, params } = renderFor('inbox', ids);
      const bulk = getItems(result.current.bulkActionContext);

      await findByName(bulk, 'actions.moveAllToTrash').action?.(undefined);
      const arg = showMock.mock.calls[0][0];
      arg.action.onClick();

      expect(params.moveToFolder).toHaveBeenCalledWith({
        emailIds: ids,
        sourceMailbox: 'trash',
        targetMailbox: 'inbox',
      });
    });

    test('When the bulk move fails, then no toast is shown but selection is cleared', async () => {
      const ids = ['mail-1'];
      const params = makeParams();
      params.deleteEmails = vi.fn().mockRejectedValue(new Error('boom'));
      const { result } = renderHook(() => useListActionContext('inbox', ids, params));
      const bulk = getItems(result.current.bulkActionContext);

      await findByName(bulk, 'actions.moveAllToTrash').action?.(undefined);

      expect(showMock).not.toHaveBeenCalled();
      expect(params.selectNone).toHaveBeenCalledOnce();
    });
  });

  describe('sent', () => {
    test('When the folder is sent, then it returns only all and none selection actions', () => {
      const { result } = renderFor('sent');
      const names = getItems(result.current.listActionContext).map((a) => a.name);
      expect(names).toEqual(['filter.all', 'filter.none']);
    });

    test('When the folder is sent, then it returns no bulk actions', () => {
      const { result } = renderFor('sent');
      expect(getItems(result.current.bulkActionContext)).toHaveLength(0);
    });
  });

  describe('drafts', () => {
    test('When the folder is drafts, then it returns only all and none selection actions', () => {
      const { result } = renderFor('drafts');
      const names = getItems(result.current.listActionContext).map((a) => a.name);
      expect(names).toEqual(['filter.all', 'filter.none']);
    });

    test('When the folder is drafts, then it offers only move to trash', () => {
      const { result } = renderFor('drafts');
      const names = getItems(result.current.bulkActionContext).map((a) => a.name);
      expect(names).toEqual(['actions.moveAllToTrash']);
    });
  });

  describe('trash', () => {
    test('When the folder is trash, then it returns only all and none selection actions', () => {
      const { result } = renderFor('trash');
      const names = getItems(result.current.listActionContext).map((a) => a.name);
      expect(names).toEqual(['filter.all', 'filter.none']);
    });

    test('When the folder is trash, then it returns an emptyTrash bulk action', () => {
      const { result } = renderFor('trash');
      const bulk = getItems(result.current.bulkActionContext);
      expect(bulk).toHaveLength(1);
      expect(bulk[0].name).toBe('actions.emptyTrash');
    });
  });

  describe('spam', () => {
    test('When the folder is spam, then it returns all four selection actions', () => {
      const { result } = renderFor('spam');
      const names = getItems(result.current.listActionContext).map((a) => a.name);
      expect(names).toEqual(['filter.all', 'filter.none', 'filter.read', 'filter.unread']);
    });

    test('When the folder is spam, then it offers move to inbox, archive and trash', () => {
      const { result } = renderFor('spam');
      const names = getItems(result.current.bulkActionContext).map((a) => a.name);
      expect(names).toEqual(['actions.moveAllToInbox', 'actions.moveAllToArchive', 'actions.moveAllToTrash']);
    });
  });

  describe('archive', () => {
    test('When the folder is archive, then it offers move to inbox, spam and trash', () => {
      const { result } = renderFor('archive');
      const names = getItems(result.current.bulkActionContext).map((a) => a.name);
      expect(names).toEqual(['actions.moveAllToInbox', 'actions.moveAllToSpam', 'actions.moveAllToTrash']);
    });
  });
});
