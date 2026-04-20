import { CaretDownIcon, CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';

interface MiniCalendarProps {
  selected: Dayjs | null;
  onSelect: (date: Dayjs) => void;
  selectTodayLabel: string;
}

const WEEKDAYS = Array.from({ length: 7 }, (_, i) =>
  dayjs()
    .day(i === 6 ? 0 : i + 1)
    .format('ddd'),
);
const MONTHS_SHORT = Array.from({ length: 12 }, (_, i) => dayjs().month(i).format('MMM'));
const MONTHS_FULL = Array.from({ length: 12 }, (_, i) => dayjs().month(i).format('MMMM'));
const MIN_YEAR = 1970;

const Calendar = ({ selected, onSelect, selectTodayLabel }: MiniCalendarProps) => {
  const [cursor, setCursor] = useState(selected ?? dayjs());
  const [openPicker, setOpenPicker] = useState<'month' | 'year' | null>(null);
  const today = dayjs();

  const startOfMonth = cursor.startOf('month');
  const firstDayOffset = (startOfMonth.day() + 6) % 7;
  const daysInMonth = cursor.daysInMonth();

  const cells: (Dayjs | null)[] = [
    ...new Array(firstDayOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => startOfMonth.add(i, 'day')),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const allYears = Array.from({ length: today.year() - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);

  const togglePicker = (picker: 'month' | 'year') => setOpenPicker((prev) => (prev === picker ? null : picker));

  const getDayClassName = (day: Dayjs) => {
    const isSelected = selected ? day.isSame(selected, 'day') : false;
    const isToday = day.isSame(today, 'day');
    const isOtherMonth = !day.isSame(cursor, 'month');
    const base = 'flex h-7 w-full items-center justify-center rounded-full text-xs transition-colors';
    if (isSelected) return `${base} bg-primary font-semibold text-white`;
    if (isToday) return `${base} font-semibold text-primary hover:bg-primary/10`;
    if (isOtherMonth) return `${base} text-gray-20 hover:bg-gray-5`;
    return `${base} text-gray-80 hover:bg-gray-5 dark:hover:bg-gray-10`;
  };

  return (
    <div className="z-50 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={() => setCursor((c) => c.subtract(1, 'month'))}
          className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-gray-5 dark:hover:bg-gray-10"
        >
          <CaretLeftIcon size={14} />
        </button>

        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePicker('month')}
              className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-sm font-semibold transition-colors hover:bg-gray-5 dark:hover:bg-gray-10 ${openPicker === 'month' ? 'text-primary' : 'text-gray-100'}`}
            >
              {MONTHS_FULL[cursor.month()]}
              <CaretDownIcon
                size={11}
                weight="bold"
                className={`transition-transform duration-150 ${openPicker === 'month' ? 'rotate-180' : ''}`}
              />
            </button>
            {openPicker === 'month' && (
              <div className="absolute left-0 top-full z-50 mt-1 w-32 overflow-hidden rounded-lg border border-gray-10 bg-surface shadow-subtle-hard dark:bg-gray-5">
                <div className="max-h-48 overflow-y-auto py-1">
                  {MONTHS_SHORT.map((m, i) => {
                    const isCurrent = cursor.month() === i;
                    return (
                      <button
                        key={m}
                        type="button"
                        data-selected={isCurrent}
                        onClick={() => {
                          setCursor((c) => c.month(i));
                          setOpenPicker(null);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-sm transition-colors ${isCurrent ? 'bg-primary/10 font-semibold text-primary' : 'text-gray-80 hover:bg-gray-5 dark:hover:bg-gray-10'}`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => togglePicker('year')}
              className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-sm font-semibold transition-colors hover:bg-gray-5 dark:hover:bg-gray-10 ${openPicker === 'year' ? 'text-primary' : 'text-gray-100'}`}
            >
              {cursor.year()}
              <CaretDownIcon
                size={11}
                weight="bold"
                className={`transition-transform duration-150 ${openPicker === 'year' ? 'rotate-180' : ''}`}
              />
            </button>
            {openPicker === 'year' && (
              <div className="absolute left-0 top-full z-50 mt-1 w-24 overflow-hidden rounded-lg border border-gray-10 bg-surface shadow-subtle-hard dark:bg-gray-5">
                <div
                  className="max-h-48 overflow-y-auto py-1"
                  ref={(el) => {
                    if (!el) return;
                    el.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'center' });
                  }}
                >
                  {allYears.map((y) => {
                    const isCurrent = cursor.year() === y;
                    return (
                      <button
                        key={y}
                        type="button"
                        data-selected={isCurrent}
                        onClick={() => {
                          setCursor((c) => c.year(y));
                          setOpenPicker(null);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-sm transition-colors ${isCurrent ? 'bg-primary/10 font-semibold text-primary' : 'text-gray-80 hover:bg-gray-5 dark:hover:bg-gray-10'}`}
                      >
                        {y}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCursor((c) => c.add(1, 'month'))}
          className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-gray-5 dark:hover:bg-gray-10"
        >
          <CaretRightIcon size={14} />
        </button>
      </div>

      <div className="grid grid-cols-7 px-2 pb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 text-center text-xs font-medium text-gray-40">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`pad-${cursor.format('YYYY-MM')}-${i}`} />;
          return (
            <button
              key={day.format('YYYY-MM-DD')}
              type="button"
              onClick={() => onSelect(day)}
              className={getDayClassName(day)}
            >
              {day.date()}
            </button>
          );
        })}
      </div>

      <div className="border-t border-gray-5 px-3 py-2 dark:border-gray-10">
        <button
          type="button"
          onClick={() => onSelect(today)}
          className="w-full text-center text-sm text-gray-60 hover:text-gray-100"
        >
          {selectTodayLabel}
        </button>
      </div>
    </div>
  );
};

export default Calendar;
