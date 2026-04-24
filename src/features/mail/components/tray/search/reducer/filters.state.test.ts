import { describe, test, expect } from 'vitest';
import dayjs from 'dayjs';
import { filterReducer } from './filters.state';
import { initialFilterState } from './filters.config';
import {
  resetFilters,
  setAddEmail,
  setAfterDate,
  setBeforeDate,
  setDatePreset,
  setRemoveEmail,
  setSearchQuery,
  setToggleFilter,
} from './filters.actions';

describe('Search filters', () => {
  describe('Search query', () => {
    test('When the user types a query, then it is stored in the search state', () => {
      const state = filterReducer(initialFilterState, setSearchQuery('hello'));

      expect(state.searchQuery).toStrictEqual('hello');
    });

    test('When the user clears the query, then the search state is empty', () => {
      const withQuery = filterReducer(initialFilterState, setSearchQuery('hello'));

      const state = filterReducer(withQuery, setSearchQuery(''));

      expect(state.searchQuery).toStrictEqual('');
    });
  });

  describe('Toggling filters', () => {
    test('When a simple filter is enabled, then it appears as active', () => {
      const state = filterReducer(initialFilterState, setToggleFilter('hasAttachments', 0));

      expect(state.activeFilters).toContain('hasAttachments');
      expect(state.expandedFilter).toBeNull();
    });

    test('When an active simple filter is toggled again, then it is deactivated', () => {
      const enabled = filterReducer(initialFilterState, setToggleFilter('hasAttachments', 0));

      const state = filterReducer(enabled, setToggleFilter('hasAttachments', 0));

      expect(state.activeFilters).not.toContain('hasAttachments');
    });

    test('When a panel filter is opened, then its dropdown is expanded and positioned correctly', () => {
      const state = filterReducer(initialFilterState, setToggleFilter('from', 120));

      expect(state.expandedFilter).toStrictEqual('from');
      expect(state.filterOffsetLeft).toStrictEqual(120);
      expect(state.activeFilters).toStrictEqual([]);
    });

    test('When an open panel filter is toggled again, then its dropdown closes', () => {
      const expanded = filterReducer(initialFilterState, setToggleFilter('date', 80));

      const state = filterReducer(expanded, setToggleFilter('date', 80));

      expect(state.expandedFilter).toBeNull();
    });

    test('When the date panel is closed while "specific date" was selected with no dates entered, then the date selection resets', () => {
      const withPreset = filterReducer(initialFilterState, setDatePreset('specificDate'));
      const expanded = filterReducer(withPreset, setToggleFilter('date', 0));

      const state = filterReducer(expanded, setToggleFilter('date', 0));

      expect(state.datePreset).toStrictEqual('anyDate');
    });

    test('When the date panel is closed while "specific date" was selected and a date was entered, then the date selection is preserved', () => {
      const withPreset = filterReducer(initialFilterState, setDatePreset('specificDate'));
      const withDate = filterReducer(withPreset, setAfterDate(dayjs('2024-01-01')));
      const expanded = filterReducer(withDate, setToggleFilter('date', 0));

      const state = filterReducer(expanded, setToggleFilter('date', 0));

      expect(state.datePreset).toStrictEqual('specificDate');
    });
  });

  describe('Filtering by sender or recipient', () => {
    test('When a sender email is added, then it appears in the sender list and the sender filter becomes active', () => {
      const state = filterReducer(initialFilterState, setAddEmail('from', 'a@test.com'));

      expect(state.fromEmails).toStrictEqual(['a@test.com']);
      expect(state.activeFilters).toContain('from');
    });

    test('When a recipient email is added, then it appears in the recipient list and the recipient filter becomes active', () => {
      const state = filterReducer(initialFilterState, setAddEmail('to', 'b@test.com'));

      expect(state.toEmails).toStrictEqual(['b@test.com']);
      expect(state.activeFilters).toContain('to');
    });

    test('When one of multiple sender emails is removed, then the sender filter stays active', () => {
      const with2 = filterReducer(
        filterReducer(initialFilterState, setAddEmail('from', 'a@test.com')),
        setAddEmail('from', 'b@test.com'),
      );

      const state = filterReducer(with2, setRemoveEmail('from', 'a@test.com'));

      expect(state.fromEmails).toStrictEqual(['b@test.com']);
      expect(state.activeFilters).toContain('from');
    });

    test('When the last sender email is removed, then the sender filter is deactivated', () => {
      const withEmail = filterReducer(initialFilterState, setAddEmail('from', 'a@test.com'));

      const state = filterReducer(withEmail, setRemoveEmail('from', 'a@test.com'));

      expect(state.fromEmails).toStrictEqual([]);
      expect(state.activeFilters).not.toContain('from');
    });
  });

  describe('Filtering by date', () => {
    test('When "any date" is selected, then date filters and entered dates are cleared', () => {
      const withDate = filterReducer(
        filterReducer(initialFilterState, setDatePreset('last7days')),
        setAfterDate(dayjs('2024-01-01')),
      );

      const state = filterReducer(withDate, setDatePreset('anyDate'));

      expect(state.datePreset).toStrictEqual('anyDate');
      expect(state.afterDate).toBeNull();
      expect(state.beforeDate).toBeNull();
      expect(state.activeFilters).not.toContain('date');
    });

    test('When a date range preset is selected, then the date filter becomes active', () => {
      const state = filterReducer(initialFilterState, setDatePreset('last30days'));

      expect(state.datePreset).toStrictEqual('last30days');
      expect(state.activeFilters).toContain('date');
    });

    test('When a preset other than "specific date" is selected, then the date panel closes', () => {
      const expanded = filterReducer(initialFilterState, setToggleFilter('date', 0));

      const state = filterReducer(expanded, setDatePreset('today'));

      expect(state.expandedFilter).toBeNull();
    });

    test('When "specific date" is selected, then the date panel stays open for manual input', () => {
      const expanded = filterReducer(initialFilterState, setToggleFilter('date', 0));

      const state = filterReducer(expanded, setDatePreset('specificDate'));

      expect(state.expandedFilter).toStrictEqual('date');
    });

    test('When a start date is entered, then it is stored for filtering', () => {
      const date = dayjs('2024-06-01');

      const state = filterReducer(initialFilterState, setAfterDate(date));

      expect(state.afterDate).toStrictEqual(date);
    });

    test('When an end date is entered, then it is stored for filtering', () => {
      const date = dayjs('2024-12-31');

      const state = filterReducer(initialFilterState, setBeforeDate(date));

      expect(state.beforeDate).toStrictEqual(date);
    });
  });

  describe('Resetting filters', () => {
    test('When all filters are reset, then the search state returns to its initial empty state', () => {
      const dirty = filterReducer(
        filterReducer(filterReducer(initialFilterState, setAddEmail('from', 'a@test.com')), setDatePreset('last7days')),
        setToggleFilter('hasAttachments', 0),
      );

      const state = filterReducer(dirty, resetFilters());

      expect(state).toStrictEqual(initialFilterState);
    });
  });
});
