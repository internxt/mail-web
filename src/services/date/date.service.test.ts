import { describe, expect, test } from 'vitest';
import { DateService } from '.';

const FIXED_DATE = '2024-04-10T11:32:00Z';

describe('Date Service', () => {
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

  describe('From now on', () => {
    test('When getting relative time for a recent date, then it should return a relative string', () => {
      const recent = new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString();
      const result = DateService.fromNow(recent);
      expect(result).toStrictEqual('2 hours ago');
    });

    test('When getting relative time for a future date, then it should return a future string', () => {
      const future = new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString();
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
