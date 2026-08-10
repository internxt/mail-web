import { useTranslationContext } from '@/i18n';
import { DateService } from '@/services/date';
import type { Dayjs } from 'dayjs';
import { useReducer } from 'react';
import { getDatePresetLabel } from './filters/date-filter/presets';
import {
  resetFilters,
  setAddEmail,
  setAfterDate,
  setBeforeDate,
  setClearFilter,
  setDatePreset,
  setRemoveEmail,
  setSearchQuery,
  setToggleFilter,
} from './reducer/filters.actions';
import { initialFilterState } from './reducer/filters.config';
import { filterReducer } from './reducer/filters.state';
import type { DatePreset, FilterId } from './types';

const SUMMARY_DATE_FORMAT = 'DD/MM/YY';

export interface FilterItemData {
  id: FilterId;
  label: string;
  value?: string;
}

export const useSearchFilters = () => {
  const { translate } = useTranslationContext();
  const [filters, dispatch] = useReducer(filterReducer, initialFilterState);
  const { activeFilters, expandedFilter, filterOffsetLeft, fromEmails, toEmails, datePreset, afterDate, beforeDate } =
    filters;

  const emailsSummary = (emails: string[]): string | undefined => {
    if (emails.length === 0) return undefined;
    if (emails.length === 1) return emails[0];
    return translate('search.filters.emailsSummary', { email: emails[0], count: emails.length - 1 });
  };

  const dateSummary = (): string | undefined => {
    if (datePreset !== 'specificDate') return getDatePresetLabel(datePreset, translate);

    const after = afterDate ? DateService.format(afterDate, SUMMARY_DATE_FORMAT) : undefined;
    const before = beforeDate ? DateService.format(beforeDate, SUMMARY_DATE_FORMAT) : undefined;

    if (after && before) return translate('search.date.rangeSummary', { after, before });
    if (after) return translate('search.date.afterSummary', { date: after });
    if (before) return translate('search.date.beforeSummary', { date: before });
    return undefined;
  };

  const summaries: Partial<Record<FilterId, string | undefined>> = {
    from: emailsSummary(fromEmails),
    to: emailsSummary(toEmails),
    date: dateSummary(),
  };

  const filterItems: FilterItemData[] = (
    ['from', 'to', 'date', 'hasAttachments', 'unread'] as const satisfies readonly FilterId[]
  ).map((id) => ({
    id,
    label: translate(`search.filters.${id}`),
    value: activeFilters.includes(id) ? summaries[id] : undefined,
  }));

  const contactFilter = expandedFilter === 'from' || expandedFilter === 'to' ? expandedFilter : null;
  const expandedEmails = expandedFilter === 'from' ? fromEmails : toEmails;

  const toggleFilter = (id: FilterId, offsetLeft: number) => dispatch(setToggleFilter(id, offsetLeft));
  const clearFilter = (id: FilterId) => dispatch(setClearFilter(id));
  const addEmail = (filterId: 'from' | 'to', email: string) => dispatch(setAddEmail(filterId, email));
  const removeEmail = (filterId: 'from' | 'to', email: string) => dispatch(setRemoveEmail(filterId, email));
  const changeSearchQuery = (query: string) => dispatch(setSearchQuery(query));
  const changeDatePreset = (preset: DatePreset) => dispatch(setDatePreset(preset));
  const changeAfterDate = (date: Dayjs) => dispatch(setAfterDate(date));
  const changeBeforeDate = (date: Dayjs) => dispatch(setBeforeDate(date));
  const resetAllFilters = () => dispatch(resetFilters());

  const collapseFilterPanel = () => {
    if (expandedFilter) dispatch(setToggleFilter(expandedFilter, filterOffsetLeft));
  };

  return {
    filters,
    filterItems,
    contactFilter,
    expandedEmails,
    toggleFilter,
    clearFilter,
    addEmail,
    removeEmail,
    changeSearchQuery,
    changeDatePreset,
    changeAfterDate,
    changeBeforeDate,
    collapseFilterPanel,
    resetAllFilters,
  };
};
