import type { Translate } from '@/i18n';
import dayjs from 'dayjs';
import type { DatePreset } from '../../types';

export const DATE_PRESETS: DatePreset[] = [
  'anyDate',
  'today',
  'last7days',
  'last30days',
  'thisYear',
  'lastYear',
  'specificDate',
];

export const getDatePresetLabel = (preset: DatePreset, translate: Translate): string => {
  const year = dayjs().year();

  switch (preset) {
    case 'thisYear':
      return translate('search.date.thisYear', { year: year.toString() });
    case 'lastYear':
      return translate('search.date.lastYear', { year: (year - 1).toString() });
    default:
      return translate(`search.date.${preset}`);
  }
};
