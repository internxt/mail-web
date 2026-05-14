import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getDaysUntil } from '.';

describe('Calculating the days remaining until a future date', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-11T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('When no date is provided, then no value is returned', () => {
    const result = getDaysUntil(undefined);

    expect(result).toBeUndefined();
  });

  test('When the date is several days in the future, then the remaining whole days are returned', () => {
    const result = getDaysUntil('2026-05-16T12:00:00.000Z');

    expect(result).toBe(5);
  });

  test('When the date is less than a full day away, then it is counted as one day remaining', () => {
    const result = getDaysUntil('2026-05-11T13:00:00.000Z');

    expect(result).toBe(1);
  });

  test('When the date has already passed, then no days are reported as remaining', () => {
    const result = getDaysUntil('2026-05-01T00:00:00.000Z');

    expect(result).toBe(0);
  });

  test('When the date is exactly the current moment, then no days are reported as remaining', () => {
    const result = getDaysUntil('2026-05-11T12:00:00.000Z');

    expect(result).toBe(0);
  });

  test('When the provided value is not a valid date, then no value is returned', () => {
    const result = getDaysUntil('not-a-date');

    expect(result).toBeUndefined();
  });
});
