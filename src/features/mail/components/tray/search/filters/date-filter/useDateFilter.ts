import { DateService } from '@/services/date';
import dayjs, { type Dayjs } from 'dayjs';
import { useRef, useState } from 'react';
import type { DatePreset } from '../../types';

const DATE_INPUT_FORMAT = 'DD/MM/YYYY';

type CalendarSide = 'after' | 'before';

interface UseDateFilterProps {
  afterDate: Dayjs | null;
  beforeDate: Dayjs | null;
  onSelectPreset: (id: DatePreset) => void;
  onAfterDate: (date: Dayjs) => void;
  onBeforeDate: (date: Dayjs) => void;
}

const presetRange = (preset: DatePreset): { after: Dayjs; before: Dayjs } | null => {
  const now = dayjs();

  switch (preset) {
    case 'today':
      return { after: now.startOf('day'), before: now.endOf('day') };
    case 'last7days':
      return { after: now.subtract(7, 'day'), before: now };
    case 'last30days':
      return { after: now.subtract(30, 'day'), before: now };
    case 'thisYear':
      return { after: now.startOf('year'), before: now.endOf('year') };
    case 'lastYear':
      return { after: now.subtract(1, 'year').startOf('year'), before: now.subtract(1, 'year').endOf('year') };
    default:
      return null;
  }
};

export const useDateFilter = ({
  afterDate,
  beforeDate,
  onSelectPreset,
  onAfterDate,
  onBeforeDate,
}: UseDateFilterProps) => {
  const [activeCalendar, setActiveCalendar] = useState<CalendarSide | null>(null);
  const [drafts, setDrafts] = useState<Record<CalendarSide, string>>({ after: '', before: '' });
  const discardedSide = useRef<CalendarSide | null>(null);

  const dateFor = (side: CalendarSide) => (side === 'after' ? afterDate : beforeDate);
  const commitDate = (side: CalendarSide, date: Dayjs) => (side === 'after' ? onAfterDate(date) : onBeforeDate(date));
  const setDraft = (side: CalendarSide, value: string) => setDrafts((previous) => ({ ...previous, [side]: value }));
  const clearDrafts = () => setDrafts({ after: '', before: '' });

  const selectPreset = (preset: DatePreset) => {
    onSelectPreset(preset);

    const range = presetRange(preset);
    if (range) {
      onAfterDate(range.after);
      onBeforeDate(range.before);
    }

    if (preset !== 'specificDate') setActiveCalendar(null);
  };

  const dateInputValue = (side: CalendarSide) => {
    if (activeCalendar === side || drafts[side]) return drafts[side];
    const date = dateFor(side);
    return date ? DateService.format(date, DATE_INPUT_FORMAT) : '';
  };

  const changeDateInput = (side: CalendarSide, value: string) => setDraft(side, value);

  const focusDateInput = (side: CalendarSide) => {
    const date = dateFor(side);
    setDraft(side, date ? DateService.format(date, DATE_INPUT_FORMAT) : '');
    setActiveCalendar(side);
  };

  const blurDateInput = (side: CalendarSide) => {
    const wasDiscarded = discardedSide.current === side;
    if (wasDiscarded) discardedSide.current = null;

    if (!wasDiscarded) {
      const parsed = dayjs(drafts[side], DATE_INPUT_FORMAT, true);
      if (parsed.isValid()) commitDate(side, parsed);
    }

    setDraft(side, '');
    setActiveCalendar(null);
  };

  const discardDateInput = (side: CalendarSide) => {
    discardedSide.current = side;
    setDraft(side, '');
    setActiveCalendar(null);
  };

  const selectCalendarDate = (date: Dayjs) => {
    if (!activeCalendar) return;

    commitDate(activeCalendar, date);
    setActiveCalendar(null);
    clearDrafts();
  };

  return {
    activeCalendar,
    calendarDate: activeCalendar ? dateFor(activeCalendar) : null,
    selectPreset,
    dateInputValue,
    changeDateInput,
    focusDateInput,
    blurDateInput,
    discardDateInput,
    selectCalendarDate,
  };
};
