import { useTranslationContext } from '@/i18n';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useState } from 'react';
import Calendar from '../../components/calendar';
import type { DatePreset } from '../../types';

interface DateFilterDropdownProps {
  offsetLeft: number;
  selected: DatePreset;
  afterDate: Dayjs | null;
  beforeDate: Dayjs | null;
  onSelectPreset: (id: DatePreset) => void;
  onAfterDate: (date: Dayjs) => void;
  onBeforeDate: (date: Dayjs) => void;
}

const DateFilter = ({
  offsetLeft,
  selected,
  afterDate,
  beforeDate,
  onSelectPreset,
  onAfterDate,
  onBeforeDate,
}: DateFilterDropdownProps) => {
  const { translate } = useTranslationContext();
  const now = dayjs();
  const [activeCalendar, setActiveCalendar] = useState<'after' | 'before' | null>(null);
  const [afterDraft, setAfterDraft] = useState('');
  const [beforeDraft, setBeforeDraft] = useState('');

  const presets: { id: DatePreset; label: string; action?: () => void }[] = [
    { id: 'anyDate', label: translate('search.date.anyDate') },
    {
      id: 'today',
      label: translate('search.date.today'),
      action: () => {
        onAfterDate(now.startOf('day'));
        onBeforeDate(now.endOf('day'));
      },
    },
    {
      id: 'last7days',
      label: translate('search.date.last7days'),
      action: () => {
        onAfterDate(now.subtract(7, 'day'));
        onBeforeDate(now);
      },
    },
    {
      id: 'last30days',
      label: translate('search.date.last30days'),
      action: () => {
        onAfterDate(now.subtract(30, 'day'));
        onBeforeDate(now);
      },
    },
    {
      id: 'thisYear',
      label: translate('search.date.thisYear', { year: now.year().toString() }),
      action: () => {
        onAfterDate(now.startOf('year'));
        onBeforeDate(now.endOf('year'));
      },
    },
    {
      id: 'lastYear',
      label: translate('search.date.lastYear', { year: (now.year() - 1).toString() }),
      action: () => {
        onAfterDate(now.subtract(1, 'year').startOf('year'));
        onBeforeDate(now.subtract(1, 'year').endOf('year'));
      },
    },
    { id: 'specificDate', label: translate('search.date.specificDate') },
  ];

  return (
    <div className="absolute top-full z-30 mt-1" style={{ left: offsetLeft }}>
      <div className="relative w-72 rounded-xl border border-gray-10 bg-surface shadow-subtle-hard dark:bg-gray-5">
        <ul className="py-1.5">
          {presets.map(({ id, label, action }) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => {
                  onSelectPreset(id);
                  action?.();
                  if (id !== 'specificDate') setActiveCalendar(null);
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-100 hover:bg-gray-5 dark:hover:bg-gray-10"
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    selected === id ? 'border-primary' : 'border-gray-30'
                  }`}
                >
                  {selected === id && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
                {label}
              </button>
            </li>
          ))}
        </ul>

        {selected === 'specificDate' && (
          <div className="border-t border-gray-5 px-4 pb-3 pt-3 dark:border-gray-10">
            <div className="flex gap-3">
              {(['after', 'before'] as const).map((side) => {
                const dateValue = side === 'after' ? afterDate : beforeDate;
                const onCommit = side === 'after' ? onAfterDate : onBeforeDate;
                const draft = side === 'after' ? afterDraft : beforeDraft;
                const setDraft = side === 'after' ? setAfterDraft : setBeforeDraft;
                return (
                  <div key={side} className="flex-1">
                    <p className="mb-1 text-xs font-medium text-gray-60">
                      {side === 'after' ? translate('search.date.after') : translate('search.date.before')}
                    </p>
                    <input
                      type="text"
                      value={activeCalendar === side || draft ? draft : (dateValue?.format('DD/MM/YYYY') ?? '')}
                      placeholder={translate('search.date.format')}
                      onChange={(e) => setDraft(e.target.value)}
                      onFocus={() => {
                        setDraft(dateValue ? dateValue.format('DD/MM/YYYY') : '');
                        setActiveCalendar(side);
                      }}
                      onBlur={() => {
                        const parsed = dayjs(draft, 'DD/MM/YYYY', true);
                        if (parsed.isValid()) {
                          onCommit(parsed);
                        }
                        setDraft('');
                        setActiveCalendar(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                        if (e.key === 'Escape') {
                          setDraft('');
                          setActiveCalendar(null);
                          e.currentTarget.blur();
                        }
                      }}
                      className={`w-full rounded-lg border px-2.5 py-1.5 text-left text-sm outline-none transition-colors ${
                        activeCalendar === side
                          ? 'border-primary text-gray-100 ring-2 ring-primary/10'
                          : 'border-gray-10 text-gray-40 hover:border-gray-20'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {activeCalendar && (
        <div
          className="absolute z-40 mt-1 w-72 rounded-xl border border-gray-10 bg-surface shadow-subtle-hard dark:bg-gray-5"
          style={{ top: '100%' }}
          role="none"
          onMouseDown={(e) => e.preventDefault()}
        >
          <Calendar
            key={activeCalendar}
            selected={activeCalendar === 'after' ? afterDate : beforeDate}
            onSelect={(date) => {
              if (activeCalendar === 'after') {
                onAfterDate(date);
              } else {
                onBeforeDate(date);
              }
              setActiveCalendar(null);
              setAfterDraft('');
              setBeforeDraft('');
            }}
            selectTodayLabel={translate('search.date.selectToday')}
          />
        </div>
      )}
    </div>
  );
};

export default DateFilter;
