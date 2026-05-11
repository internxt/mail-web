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

  test('When no date is provided, then it should return undefined', () => {
    const result = getDaysUntil(undefined);

    expect(result).toBeUndefined();
  });

  test('When the date is several days in the future, then it should return the rounded-up day count', () => {
    const result = getDaysUntil('2026-05-16T12:00:00.000Z');

    expect(result).toBe(5);
  });

  test('When the date is less than a full day in the future, then it should round up to 1', () => {
    const result = getDaysUntil('2026-05-11T13:00:00.000Z');

    expect(result).toBe(1);
  });

  test('When the date is in the past, then it should clamp to 0', () => {
    const result = getDaysUntil('2026-05-01T00:00:00.000Z');

    expect(result).toBe(0);
  });

  test('When the date is exactly now, then it should return 0', () => {
    const result = getDaysUntil('2026-05-11T12:00:00.000Z');

    expect(result).toBe(0);
  });
});
