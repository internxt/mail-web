import { act, renderHook } from '@testing-library/react';
import dayjs from 'dayjs';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useDateFilter } from './useDateFilter';

const onSelectPreset = vi.fn();
const onAfterDate = vi.fn();
const onBeforeDate = vi.fn();

const renderDateFilter = (afterDate = null as dayjs.Dayjs | null, beforeDate = null as dayjs.Dayjs | null) =>
  renderHook(() => useDateFilter({ afterDate, beforeDate, onSelectPreset, onAfterDate, onBeforeDate }));

describe('Date filter panel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    onSelectPreset.mockClear();
    onAfterDate.mockClear();
    onBeforeDate.mockClear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Choosing a predefined range', () => {
    test('When today is chosen, then the range covers the whole current day', () => {
      const { result } = renderDateFilter();

      act(() => result.current.selectPreset('today'));

      expect(onSelectPreset).toHaveBeenCalledWith('today');
      expect(onAfterDate.mock.calls[0][0].toISOString()).toStrictEqual(dayjs().startOf('day').toISOString());
      expect(onBeforeDate.mock.calls[0][0].toISOString()).toStrictEqual(dayjs().endOf('day').toISOString());
    });

    test('When the last seven days are chosen, then the range starts a week before now', () => {
      const { result } = renderDateFilter();

      act(() => result.current.selectPreset('last7days'));

      expect(onAfterDate.mock.calls[0][0].toISOString()).toStrictEqual(dayjs().subtract(7, 'day').toISOString());
      expect(onBeforeDate.mock.calls[0][0].toISOString()).toStrictEqual(dayjs().toISOString());
    });

    test('When the previous year is chosen, then the range covers that year from start to end', () => {
      const { result } = renderDateFilter();

      act(() => result.current.selectPreset('lastYear'));

      expect(onAfterDate.mock.calls[0][0].format('YYYY-MM-DD')).toStrictEqual('2025-01-01');
      expect(onBeforeDate.mock.calls[0][0].format('YYYY-MM-DD')).toStrictEqual('2025-12-31');
    });

    test('When any date is chosen, then no range boundaries are set', () => {
      const { result } = renderDateFilter();

      act(() => result.current.selectPreset('anyDate'));

      expect(onSelectPreset).toHaveBeenCalledWith('anyDate');
      expect(onAfterDate).not.toHaveBeenCalled();
      expect(onBeforeDate).not.toHaveBeenCalled();
    });

    test('When a predefined range is chosen while a calendar is open, then the calendar closes', () => {
      const { result } = renderDateFilter();
      act(() => result.current.focusDateInput('after'));

      act(() => result.current.selectPreset('last30days'));

      expect(result.current.activeCalendar).toBeNull();
    });
  });

  describe('Typing a date', () => {
    test('When an input is focused, then its calendar opens showing the date already selected', () => {
      const selectedDate = dayjs('2024-06-01');
      const { result } = renderDateFilter(selectedDate);

      act(() => result.current.focusDateInput('after'));

      expect(result.current.activeCalendar).toStrictEqual('after');
      expect(result.current.dateInputValue('after')).toStrictEqual('01/06/2024');
    });

    test('When a valid date is typed and the input loses focus, then the date is applied', () => {
      const { result } = renderDateFilter();
      act(() => result.current.focusDateInput('before'));

      act(() => result.current.changeDateInput('before', '24/12/2025'));
      act(() => result.current.blurDateInput('before'));

      expect(onBeforeDate).toHaveBeenCalledTimes(1);
      expect(onBeforeDate.mock.calls[0][0].format('YYYY-MM-DD')).toStrictEqual('2025-12-24');
    });

    test('When an unparseable date is typed and the input loses focus, then nothing is applied', () => {
      const { result } = renderDateFilter();
      act(() => result.current.focusDateInput('after'));

      act(() => result.current.changeDateInput('after', '31/02'));
      act(() => result.current.blurDateInput('after'));

      expect(onAfterDate).not.toHaveBeenCalled();
      expect(result.current.dateInputValue('after')).toStrictEqual('');
    });

    test('When a typed date is discarded before the input loses focus, then the date is not applied', () => {
      const { result } = renderDateFilter();
      act(() => result.current.focusDateInput('after'));
      act(() => result.current.changeDateInput('after', '24/12/2025'));

      act(() => {
        result.current.discardDateInput('after');
        result.current.blurDateInput('after');
      });

      expect(onAfterDate).not.toHaveBeenCalled();
      expect(result.current.activeCalendar).toBeNull();
    });

    test('When one input is discarded, then a date typed in the other input is still applied', () => {
      const { result } = renderDateFilter();
      act(() => result.current.focusDateInput('before'));
      act(() => result.current.changeDateInput('before', '24/12/2025'));

      act(() => result.current.discardDateInput('after'));
      act(() => result.current.blurDateInput('before'));

      expect(onBeforeDate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Picking a date in the calendar', () => {
    test('When a day is picked, then it is applied to the input that opened the calendar and the calendar closes', () => {
      const { result } = renderDateFilter();
      act(() => result.current.focusDateInput('after'));

      act(() => result.current.selectCalendarDate(dayjs('2025-01-20')));

      expect(onAfterDate.mock.calls[0][0].format('YYYY-MM-DD')).toStrictEqual('2025-01-20');
      expect(onBeforeDate).not.toHaveBeenCalled();
      expect(result.current.activeCalendar).toBeNull();
    });

    test('When no calendar is open, then picking a day applies nothing', () => {
      const { result } = renderDateFilter();

      act(() => result.current.selectCalendarDate(dayjs('2025-01-20')));

      expect(onAfterDate).not.toHaveBeenCalled();
      expect(onBeforeDate).not.toHaveBeenCalled();
    });
  });
});
