import { useTranslationContext } from '@/i18n';
import type { Dayjs } from 'dayjs';
import Calendar from '../../components/calendar';
import type { DatePreset } from '../../types';
import { DATE_PRESETS, getDatePresetLabel } from './presets';
import { useDateFilter } from './useDateFilter';

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
  const {
    activeCalendar,
    calendarDate,
    selectPreset,
    dateInputValue,
    changeDateInput,
    focusDateInput,
    blurDateInput,
    discardDateInput,
    selectCalendarDate,
  } = useDateFilter({ afterDate, beforeDate, onSelectPreset, onAfterDate, onBeforeDate });

  return (
    <div className="absolute top-full z-30 mt-1" style={{ left: offsetLeft }}>
      <div className="relative w-72 rounded-xl border border-gray-10 bg-surface shadow-subtle-hard dark:bg-gray-5">
        <ul className="py-1.5" role="radiogroup" aria-label={translate('search.filters.date')}>
          {DATE_PRESETS.map((preset) => (
            <li key={preset}>
              <button
                type="button"
                role="radio"
                aria-checked={selected === preset}
                onClick={() => selectPreset(preset)}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-100 hover:bg-gray-5 dark:hover:bg-gray-10"
              >
                <span
                  aria-hidden
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    selected === preset ? 'border-primary' : 'border-gray-30'
                  }`}
                >
                  {selected === preset && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
                {getDatePresetLabel(preset, translate)}
              </button>
            </li>
          ))}
        </ul>

        {selected === 'specificDate' && (
          <div className="border-t border-gray-5 px-4 pb-3 pt-3 dark:border-gray-10">
            <div className="flex gap-3">
              {(['after', 'before'] as const).map((side) => (
                <div key={side} className="flex-1">
                  <p className="mb-1 text-xs font-medium text-gray-60">
                    {side === 'after' ? translate('search.date.after') : translate('search.date.before')}
                  </p>
                  <input
                    type="text"
                    value={dateInputValue(side)}
                    placeholder={translate('search.date.format')}
                    onChange={(e) => changeDateInput(side, e.target.value)}
                    onFocus={() => focusDateInput(side)}
                    onBlur={() => blurDateInput(side)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                      if (e.key === 'Escape') {
                        e.stopPropagation();
                        discardDateInput(side);
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
              ))}
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
            selected={calendarDate}
            onSelect={selectCalendarDate}
            selectTodayLabel={translate('search.date.selectToday')}
          />
        </div>
      )}
    </div>
  );
};

export default DateFilter;
