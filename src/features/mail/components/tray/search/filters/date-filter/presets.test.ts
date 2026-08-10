import type { Translate } from '@/i18n';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { DATE_PRESETS, getDatePresetLabel } from './presets';

const translate = vi.fn((key: string, props?: Record<string, unknown>) =>
  props ? `${key}:${Object.values(props).join(',')}` : key,
) as unknown as Translate;

describe('Date filter options', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('When an option without a year is shown, then its label is taken straight from the translations', () => {
    const preset = 'last7days';

    const label = getDatePresetLabel(preset, translate);

    expect(label).toStrictEqual('search.date.last7days');
  });

  test('When the current-year option is shown, then its label includes the current year', () => {
    const preset = 'thisYear';

    const label = getDatePresetLabel(preset, translate);

    expect(label).toStrictEqual('search.date.thisYear:2026');
  });

  test('When the previous-year option is shown, then its label includes the year before the current one', () => {
    const preset = 'lastYear';

    const label = getDatePresetLabel(preset, translate);

    expect(label).toStrictEqual('search.date.lastYear:2025');
  });

  test('When the options are listed, then every one of them resolves to a label', () => {
    const presets = DATE_PRESETS;

    const labels = presets.map((preset) => getDatePresetLabel(preset, translate));

    expect(labels).toHaveLength(presets.length);
    expect(labels.every((label) => label.length > 0)).toBe(true);
  });
});
