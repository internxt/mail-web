import { act, renderHook } from '@testing-library/react';
import dayjs from 'dayjs';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useSearchFilters } from './useSearchFilters';

vi.mock('@/i18n', () => ({
  useTranslationContext: () => ({
    translate: (key: string, props?: Record<string, unknown>) =>
      props ? `${key}:${Object.values(props).join(',')}` : key,
  }),
}));

const summaryOf = (items: { id: string; value?: string }[], id: string) => items.find((item) => item.id === id)?.value;

describe('Search filters panel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Summarising the applied filters', () => {
    test('When no filter is applied, then no filter shows a summary', () => {
      const { result } = renderHook(() => useSearchFilters());

      const { filterItems } = result.current;

      expect(filterItems.every((item) => item.value === undefined)).toBe(true);
    });

    test('When a single sender is filtered, then the sender address is summarised as is', () => {
      const { result } = renderHook(() => useSearchFilters());

      act(() => result.current.addEmail('from', 'a@test.com'));

      expect(summaryOf(result.current.filterItems, 'from')).toStrictEqual('a@test.com');
    });

    test('When several senders are filtered, then the summary shows the first one and how many are left', () => {
      const { result } = renderHook(() => useSearchFilters());

      act(() => result.current.addEmail('from', 'a@test.com'));
      act(() => result.current.addEmail('from', 'b@test.com'));
      act(() => result.current.addEmail('from', 'c@test.com'));

      expect(summaryOf(result.current.filterItems, 'from')).toStrictEqual('search.filters.emailsSummary:a@test.com,2');
    });

    test('When a predefined date range is applied, then the summary is the name of that range', () => {
      const { result } = renderHook(() => useSearchFilters());

      act(() => result.current.changeDatePreset('last7days'));

      expect(summaryOf(result.current.filterItems, 'date')).toStrictEqual('search.date.last7days');
    });

    test('When both ends of a custom date range are set, then the summary shows the two dates', () => {
      const { result } = renderHook(() => useSearchFilters());

      act(() => result.current.changeDatePreset('specificDate'));
      act(() => result.current.changeAfterDate(dayjs('2024-01-02')));
      act(() => result.current.changeBeforeDate(dayjs('2024-03-04')));

      expect(summaryOf(result.current.filterItems, 'date')).toStrictEqual('search.date.rangeSummary:02/01/24,04/03/24');
    });

    test('When only the start of a custom date range is set, then the summary describes it as a lower bound', () => {
      const { result } = renderHook(() => useSearchFilters());

      act(() => result.current.changeDatePreset('specificDate'));
      act(() => result.current.changeAfterDate(dayjs('2024-01-02')));

      expect(summaryOf(result.current.filterItems, 'date')).toStrictEqual('search.date.afterSummary:02/01/24');
    });

    test('When only the end of a custom date range is set, then the summary describes it as an upper bound', () => {
      const { result } = renderHook(() => useSearchFilters());

      act(() => result.current.changeDatePreset('specificDate'));
      act(() => result.current.changeBeforeDate(dayjs('2024-03-04')));

      expect(summaryOf(result.current.filterItems, 'date')).toStrictEqual('search.date.beforeSummary:04/03/24');
    });

    test('When a custom date range is chosen but no date is entered yet, then the date filter shows no summary', () => {
      const { result } = renderHook(() => useSearchFilters());

      act(() => result.current.changeDatePreset('specificDate'));

      expect(summaryOf(result.current.filterItems, 'date')).toBeUndefined();
    });
  });

  describe('Clearing a filter', () => {
    test('When a filter is cleared, then its values and its summary are dropped', () => {
      const { result } = renderHook(() => useSearchFilters());
      act(() => result.current.addEmail('to', 'a@test.com'));

      act(() => result.current.clearFilter('to'));

      expect(result.current.filters.toEmails).toStrictEqual([]);
      expect(summaryOf(result.current.filterItems, 'to')).toBeUndefined();
    });
  });

  describe('Collapsing the open panel', () => {
    test('When a panel is open, then collapsing it closes the panel', () => {
      const { result } = renderHook(() => useSearchFilters());
      act(() => result.current.toggleFilter('from', 40));

      act(() => result.current.collapseFilterPanel());

      expect(result.current.filters.expandedFilter).toBeNull();
    });

    test('When no panel is open, then collapsing leaves the filters untouched', () => {
      const { result } = renderHook(() => useSearchFilters());
      const before = result.current.filters;

      act(() => result.current.collapseFilterPanel());

      expect(result.current.filters).toStrictEqual(before);
    });
  });

  describe('Editing the addresses of the open panel', () => {
    test('When the sender panel is open, then it edits the sender addresses', () => {
      const { result } = renderHook(() => useSearchFilters());
      act(() => result.current.addEmail('from', 'a@test.com'));

      act(() => result.current.toggleFilter('from', 0));

      expect(result.current.contactFilter).toStrictEqual('from');
      expect(result.current.expandedEmails).toStrictEqual(['a@test.com']);
    });

    test('When the date panel is open, then no address panel is shown', () => {
      const { result } = renderHook(() => useSearchFilters());

      act(() => result.current.toggleFilter('date', 0));

      expect(result.current.contactFilter).toBeNull();
    });
  });
});
