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

const makeParams = () => ({
  selectAll: vi.fn(),
  selectNone: vi.fn(),
  selectRead: vi.fn(),
  selectUnread: vi.fn(),
  deleteEmails: vi.fn().mockResolvedValue(null),
});

const renderFor = (folder: FolderType, selectedMails: string[] = []) => {
  const params = makeParams();
  const { result } = renderHook(() => useListActionContext(folder, selectedMails, params));
  return { result, params };
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

    test('When the folder is inbox, then it returns a trashAll bulk action', () => {
      const { result } = renderFor('inbox');
      const bulk = getItems(result.current.bulkActionContext);
      expect(bulk).toHaveLength(1);
      expect(bulk[0].name).toBe('actions.trashAll');
    });

    test('When trashAll is triggered, then deleteEmails is called with all selected mail ids', async () => {
      const ids = Array.from({ length: 25 }, (_, i) => `mail-${i}`);
      const { result, params } = renderFor('inbox', ids);
      const bulk = getItems(result.current.bulkActionContext);

      await bulk[0].action?.(undefined);

      expect(params.deleteEmails).toHaveBeenCalledOnce();
      expect(params.deleteEmails).toHaveBeenCalledWith(ids);
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

    test('When trashAll completes, then it clears the selection', async () => {
      const ids = ['mail-1', 'mail-2'];
      const { result, params } = renderFor('inbox', ids);
      const bulk = getItems(result.current.bulkActionContext);
      await bulk[0].action?.(undefined);
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

    test('When the folder is drafts, then it returns a trashAll bulk action', () => {
      const { result } = renderFor('drafts');
      const bulk = getItems(result.current.bulkActionContext);
      expect(bulk).toHaveLength(1);
      expect(bulk[0].name).toBe('actions.trashAll');
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

    test('When the folder is spam, then it returns a trashAll bulk action', () => {
      const { result } = renderFor('spam');
      const bulk = getItems(result.current.bulkActionContext);
      expect(bulk).toHaveLength(1);
      expect(bulk[0].name).toBe('actions.trashAll');
    });
  });
});
