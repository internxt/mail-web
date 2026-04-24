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
  applyUnreadFilter: vi.fn(),
});

const renderFor = (folder: FolderType) => {
  const params = makeParams();
  const { result } = renderHook(() => useListActionContext(folder, params));
  return { result, params };
};

describe('List actions - custom hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('inbox', () => {
    test('returns all four selection actions', () => {
      const { result } = renderFor('inbox');
      const names = getItems(result.current.listActionContext).map((a) => a.name);
      expect(names).toEqual(['filter.all', 'filter.none', 'filter.read', 'filter.unread']);
    });

    test('returns trashAll bulk action', () => {
      const { result } = renderFor('inbox');
      const bulk = getItems(result.current.bulkActionContext);
      expect(bulk).toHaveLength(1);
      expect(bulk[0].name).toBe('actions.trashAll');
    });

    test('"All" action calls selectAll and clears unread filter', () => {
      const { result, params } = renderFor('inbox');
      getItems(result.current.listActionContext)[0].action?.(undefined);
      expect(params.selectAll).toHaveBeenCalledOnce();
      expect(params.applyUnreadFilter).toHaveBeenCalledWith(undefined);
    });

    test('"None" action calls selectNone and clears unread filter', () => {
      const { result, params } = renderFor('inbox');
      getItems(result.current.listActionContext)[1].action?.(undefined);
      expect(params.selectNone).toHaveBeenCalledOnce();
      expect(params.applyUnreadFilter).toHaveBeenCalledWith(undefined);
    });

    test('"Read" action calls selectRead and applies false unread filter', () => {
      const { result, params } = renderFor('inbox');
      getItems(result.current.listActionContext)[2].action?.(undefined);
      expect(params.selectRead).toHaveBeenCalledOnce();
      expect(params.applyUnreadFilter).toHaveBeenCalledWith(false);
    });

    test('"Unread" action calls selectUnread and applies true unread filter', () => {
      const { result, params } = renderFor('inbox');
      getItems(result.current.listActionContext)[3].action?.(undefined);
      expect(params.selectUnread).toHaveBeenCalledOnce();
      expect(params.applyUnreadFilter).toHaveBeenCalledWith(true);
    });
  });

  describe('sent', () => {
    test('returns only all and none selection actions', () => {
      const { result } = renderFor('sent');
      const names = getItems(result.current.listActionContext).map((a) => a.name);
      expect(names).toEqual(['filter.all', 'filter.none']);
    });

    test('returns no bulk actions', () => {
      const { result } = renderFor('sent');
      expect(getItems(result.current.bulkActionContext)).toHaveLength(0);
    });
  });

  describe('drafts', () => {
    test('returns only all and none selection actions', () => {
      const { result } = renderFor('drafts');
      const names = getItems(result.current.listActionContext).map((a) => a.name);
      expect(names).toEqual(['filter.all', 'filter.none']);
    });

    test('returns trashAll bulk action', () => {
      const { result } = renderFor('drafts');
      const bulk = getItems(result.current.bulkActionContext);
      expect(bulk).toHaveLength(1);
      expect(bulk[0].name).toBe('actions.trashAll');
    });
  });

  describe('trash', () => {
    test('returns only all and none selection actions', () => {
      const { result } = renderFor('trash');
      const names = getItems(result.current.listActionContext).map((a) => a.name);
      expect(names).toEqual(['filter.all', 'filter.none']);
    });

    test('returns emptyTrash bulk action', () => {
      const { result } = renderFor('trash');
      const bulk = getItems(result.current.bulkActionContext);
      expect(bulk).toHaveLength(1);
      expect(bulk[0].name).toBe('actions.emptyTrash');
    });
  });

  describe('spam', () => {
    test('returns all four selection actions', () => {
      const { result } = renderFor('spam');
      const names = getItems(result.current.listActionContext).map((a) => a.name);
      expect(names).toEqual(['filter.all', 'filter.none', 'filter.read', 'filter.unread']);
    });

    test('returns trashAll bulk action', () => {
      const { result } = renderFor('spam');
      const bulk = getItems(result.current.bulkActionContext);
      expect(bulk).toHaveLength(1);
      expect(bulk[0].name).toBe('actions.trashAll');
    });
  });
});
