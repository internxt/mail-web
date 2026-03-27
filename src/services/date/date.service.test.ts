import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { DateService } from '.';
import 'dayjs/locale/en';

const FIXED_DATE = '2024-04-10T11:32:00Z';
const FIXED_NOW = new Date(FIXED_DATE).getTime();

describe('Date Service', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    DateService.setLocale('en');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatting the date', () => {
    test('When formatting a date, then it should return the long localized format', () => {
      const result = DateService.format(FIXED_DATE);
      expect(result).toStrictEqual('April 10, 2024');
    });

    test('When formatting a date with a custom template, then it should apply it', () => {
      const result = DateService.format(FIXED_DATE, 'YYYY-MM-DD');
      expect(result).toBe('2024-04-10');
    });

    test('When formatting a Date object, then it should work correctly', () => {
      const result = DateService.format(new Date(FIXED_DATE), 'YYYY-MM-DD');
      expect(result).toBe('2024-04-10');
    });
  });

  describe('Formatting the date with time', () => {
    test('When formatting a date with time, then it should include the time', () => {
      const result = DateService.formatWithTime(FIXED_DATE);
      expect(result).toMatch(/April 10, 2024,/);
      expect(result).toMatch(/:\d{2} (AM|PM)/);
    });
  });

  describe('Formatting the mail list item timestamp', () => {
    test('When the date is today, then it should return only the time in 24h format', () => {
      const sameDay = new Date(FIXED_NOW - 1000 * 60 * 30).toISOString();
      const result = DateService.formatMailTimestamp(sameDay);
      expect(result).toBe('11:02');
    });

    test('When the date is this year but not today, then it should return month, day and time', () => {
      const sameYear = '2024-03-15T15:48:00Z';
      const result = DateService.formatMailTimestamp(sameYear);
      expect(result).toBe('Mar 15, 15:48');
    });

    test('When the date is from a different year, then it should include the year', () => {
      const differentYear = '2023-04-10T15:48:00Z';
      const result = DateService.formatMailTimestamp(differentYear);
      expect(result).toBe('Apr 10, 2023, 15:48');
    });
  });

  describe('From now on', () => {
    test('When getting relative time for a recent date, then it should return a relative string', () => {
      const recent = new Date(FIXED_NOW - 1000 * 60 * 60 * 2).toISOString();
      const result = DateService.fromNow(recent);
      expect(result).toStrictEqual('2 hours ago');
    });

    test('When getting relative time for a future date, then it should return a future string', () => {
      const future = new Date(FIXED_NOW + 1000 * 60 * 60 * 3).toISOString();
      const result = DateService.fromNow(future);
      expect(result).toStrictEqual('in 3 hours');
    });
  });

  describe('from', () => {
    test('When comparing two dates, then it should return relative time between them', () => {
      const date = '2024-04-10T09:00:00Z';
      const reference = '2024-04-10T11:00:00Z';
      const result = DateService.from(date, reference);
      expect(result).toStrictEqual('2 hours ago');
    });

    test('When date is after the reference, then it should return a future string', () => {
      const date = '2024-04-10T13:00:00Z';
      const reference = '2024-04-10T11:00:00Z';
      const result = DateService.from(date, reference);
      expect(result).toStrictEqual('in 2 hours');
    });
  });
});
