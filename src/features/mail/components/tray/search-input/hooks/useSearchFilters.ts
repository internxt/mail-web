import type { DatePreset, FilterId } from '../types';
import type { Dayjs } from 'dayjs';
import { useRef, useState } from 'react';

export const useSearchFilters = () => {
  const searchInput = useRef<HTMLInputElement>(null);
  const [openSearchBox, setOpenSearchBox] = useState(false);
  const [query, setQuery] = useState('');
  const [preventBlur, setPreventBlur] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterId[]>([]);
  const [expandedFilter, setExpandedFilter] = useState<FilterId | null>(null);
  const [filterOffsetLeft, setFilterOffsetLeft] = useState(0);
  const [fromEmails, setFromEmails] = useState<string[]>([]);
  const [toEmails, setToEmails] = useState<string[]>([]);
  const [datePreset, setDatePreset] = useState<DatePreset>('anyDate');
  const [afterDate, setAfterDate] = useState<Dayjs | null>(null);
  const [beforeDate, setBeforeDate] = useState<Dayjs | null>(null);

  const removeFilter = (filterId: FilterId) => setActiveFilters((f) => f.filter((x) => x !== filterId));

  const handleFilterToggle = (id: FilterId, offsetLeft: number) => {
    if (id === 'from' || id === 'to' || id === 'date') {
      setExpandedFilter((prev) => {
        if (prev === id) {
          if (id === 'date' && datePreset === 'specificDate' && !afterDate && !beforeDate) {
            setDatePreset('anyDate');
          }
          return null;
        }
        setFilterOffsetLeft(offsetLeft);
        return id;
      });
    } else {
      setActiveFilters((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
    }
  };

  const handleAddEmail = (filterId: 'from' | 'to', email: string) => {
    const setter = filterId === 'from' ? setFromEmails : setToEmails;
    setter((prev) => [...prev, email]);
    setActiveFilters((prev) => (prev.includes(filterId) ? prev : [...prev, filterId]));
  };

  const handleRemoveEmail = (filterId: 'from' | 'to', email: string) => {
    const setter = filterId === 'from' ? setFromEmails : setToEmails;
    setter((prev) => {
      const next = prev.filter((e) => e !== email);
      if (next.length === 0) removeFilter(filterId);
      return next;
    });
  };

  const handleDatePreset = (id: DatePreset) => {
    setDatePreset(id);
    if (id === 'anyDate') {
      removeFilter('date');
      setAfterDate(null);
      setBeforeDate(null);
    } else {
      setActiveFilters((prev) => (prev.includes('date') ? prev : [...prev, 'date']));
      if (id !== 'specificDate') setExpandedFilter(null);
    }
  };

  const handleBlur = () => {
    if (!preventBlur) {
      setOpenSearchBox(false);
      setExpandedFilter(null);
      setActiveFilters([]);
      setFromEmails([]);
      setToEmails([]);
      setDatePreset('anyDate');
      setAfterDate(null);
      setBeforeDate(null);
    }
  };

  const handleAfterDate = (date: Dayjs) => setAfterDate(date);
  const handleBeforeDate = (date: Dayjs) => setBeforeDate(date);

  return {
    searchInput,
    openSearchBox,
    setOpenSearchBox,
    query,
    setQuery,
    preventBlur,
    setPreventBlur,
    activeFilters,
    expandedFilter,
    filterOffsetLeft,
    fromEmails,
    toEmails,
    datePreset,
    afterDate,
    beforeDate,
    removeFilter,
    handleFilterToggle,
    handleAddEmail,
    handleRemoveEmail,
    handleDatePreset,
    handleAfterDate,
    handleBeforeDate,
    handleBlur,
  };
};
