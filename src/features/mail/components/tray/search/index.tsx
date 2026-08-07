import { useTranslationContext } from '@/i18n';
import { useHotkeys } from 'react-hotkeys-hook';
import ContactInput from './filters/contact-input';
import DateFilter from './filters/date-filter';
import FilterItem from './filters/filter-item';
import EmptyState from './components/empty-state';
import type { DatePreset, FilterId } from './types';
import { Activity, useReducer, useRef, useState } from 'react';
import { filterReducer } from './reducer/filters.state';
import { initialFilterState } from './reducer/filters.config';
import type { Dayjs } from 'dayjs';
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
import { getDatePresetLabel } from './filters/date-filter/presets';
import useEmailSearch from '@/hooks/mail/useEmailSearch';
import SearchInput from './components/search-input';
import SearchEmailList from './components/list';

interface SearchProps {
  onMailSelected?: (id: string, isRead?: boolean) => void;
  onOpenChange?: (open: boolean) => void;
}

const Search = ({ onMailSelected, onOpenChange }: SearchProps) => {
  const { translate } = useTranslationContext();

  const searchInput = useRef<HTMLInputElement>(null);
  const [openSearchBox, setOpenSearchBox] = useState(false);
  const [preventBlur, setPreventBlur] = useState(false);
  const [filters, dispatch] = useReducer(filterReducer, initialFilterState);
  const {
    activeFilters,
    searchQuery,
    expandedFilter,
    filterOffsetLeft,
    fromEmails,
    toEmails,
    datePreset,
    afterDate,
    beforeDate,
  } = filters;

  const {
    hasMoreEmails,
    searchEmails,
    isLoading: isLoadingSearchEmails,
    onLoadMore,
  } = useEmailSearch({
    text: searchQuery,
    from: fromEmails,
    to: toEmails,
    after: afterDate?.toISOString(),
    before: beforeDate?.toISOString(),
    hasAttachment: activeFilters.includes('hasAttachments') || undefined,
    unread: activeFilters.includes('unread') || undefined,
  });

  const handleFilterToggle = (id: FilterId, offsetLeft: number) => dispatch(setToggleFilter(id, offsetLeft));
  const handleFilterClear = (id: FilterId) => dispatch(setClearFilter(id));
  const handleAddEmail = (filterId: 'from' | 'to', email: string) => dispatch(setAddEmail(filterId, email));
  const onSearchQueryChanges = (searchQuery: string) => dispatch(setSearchQuery(searchQuery));
  const handleRemoveEmail = (filterId: 'from' | 'to', email: string) => dispatch(setRemoveEmail(filterId, email));
  const handleDatePreset = (preset: DatePreset) => dispatch(setDatePreset(preset));
  const handleAfterDate = (date: Dayjs) => dispatch(setAfterDate(date));
  const handleBeforeDate = (date: Dayjs) => dispatch(setBeforeDate(date));

  const changeSearchBoxOpen = (open: boolean) => {
    setOpenSearchBox(open);
    onOpenChange?.(open);
  };

  const closeSearchBox = () => {
    changeSearchBoxOpen(false);
    dispatch(resetFilters());
  };

  const handleBlur = () => {
    if (preventBlur) return;
    closeSearchBox();
  };

  const handleMessageSelected = (mailId: string, isRead?: boolean) => {
    onMailSelected?.(mailId, isRead);
    closeSearchBox();
  };

  useHotkeys(
    ['Meta+F', 'Control+F'],
    (e) => {
      e.preventDefault();
      searchInput.current?.focus();
    },
    [openSearchBox],
    { enableOnFormTags: ['INPUT'] },
  );

  const emailsSummary = (emails: string[]) => (emails.length > 1 ? `${emails[0]} +${emails.length - 1}` : emails[0]);

  const dateSummary = (() => {
    if (datePreset !== 'specificDate') return getDatePresetLabel(datePreset, translate);

    const after = afterDate?.format('DD/MM/YY');
    const before = beforeDate?.format('DD/MM/YY');
    if (after && before) return `${after} - ${before}`;
    if (after) return `${translate('search.date.after')} ${after}`;
    if (before) return `${translate('search.date.before')} ${before}`;
    return undefined;
  })();

  const filterItems: { id: FilterId; label: string; value?: string }[] = [
    { id: 'from', label: translate('search.filters.from'), value: emailsSummary(fromEmails) },
    { id: 'to', label: translate('search.filters.to'), value: emailsSummary(toEmails) },
    { id: 'date', label: translate('search.filters.date'), value: dateSummary },
    { id: 'hasAttachments', label: translate('search.filters.hasAttachments') },
    { id: 'unread', label: translate('search.filters.unread') },
  ];

  const dropdownClassName = (() => {
    const base =
      'absolute top-12 z-20 w-screen max-w-160 h-screen max-h-80 origin-top rounded-xl bg-surface text-gray-100 shadow-subtle-hard ring-1 ring-gray-10 transition-all duration-150 ease-out dark:bg-gray-5';
    if (openSearchBox) return `${base} translate-y-1.5 scale-100 opacity-100`;
    return `${base} pointer-events-none -translate-y-0.5 scale-[0.98] opacity-0`;
  })();

  const contactFilter = expandedFilter === 'from' || expandedFilter === 'to' ? expandedFilter : null;
  const currentEmails = expandedFilter === 'from' ? fromEmails : toEmails;

  const collapseFilterPanel = () => {
    if (expandedFilter) dispatch(setToggleFilter(expandedFilter, filterOffsetLeft));
  };

  const backdropClassName = (() => {
    const base = 'fixed inset-0 z-0 bg-black/30 transition-opacity duration-150 ease-out';
    if (openSearchBox) return `${base} opacity-100`;
    return `${base} pointer-events-none opacity-0`;
  })();

  return (
    <div className="relative z-40 flex h-full w-full items-center">
      <div role="none" className={backdropClassName} onMouseDown={closeSearchBox} />

      <div className="relative z-10 flex w-full items-center">
        <SearchInput
          handleBlur={handleBlur}
          onSearchQueryChanges={onSearchQueryChanges}
          openSearchBox={openSearchBox}
          searchInput={searchInput}
          searchQuery={searchQuery}
          setOpenSearchBox={changeSearchBoxOpen}
        />
      </div>

      <div
        role="none"
        className={dropdownClassName}
        onMouseEnter={() => setPreventBlur(true)}
        onMouseLeave={() => setPreventBlur(false)}
      >
        <div className="flex h-full w-full flex-col gap-3 px-3 py-3">
          <fieldset
            onKeyDown={(e) => e.key === 'Escape' && collapseFilterPanel()}
            className="relative flex flex-wrap items-center gap-1.5"
          >
            {filterItems.map((item) => (
              <FilterItem
                key={item.id}
                id={item.id}
                label={item.label}
                value={activeFilters.includes(item.id) ? item.value : undefined}
                activeFilters={activeFilters}
                expandedFilter={expandedFilter}
                onToggle={handleFilterToggle}
                onClear={handleFilterClear}
              />
            ))}

            <Activity mode={contactFilter ? 'visible' : 'hidden'}>
              <ContactInput
                emails={currentEmails}
                onAdd={(email) => contactFilter && handleAddEmail(contactFilter, email)}
                onRemove={(email) => contactFilter && handleRemoveEmail(contactFilter, email)}
                placeholder={translate('search.emailInputPlaceholder')}
                offsetLeft={filterOffsetLeft}
              />
            </Activity>

            <Activity mode={expandedFilter === 'date' ? 'visible' : 'hidden'}>
              <DateFilter
                offsetLeft={filterOffsetLeft}
                selected={datePreset}
                afterDate={afterDate}
                beforeDate={beforeDate}
                onSelectPreset={handleDatePreset}
                onAfterDate={handleAfterDate}
                onBeforeDate={handleBeforeDate}
              />
            </Activity>
          </fieldset>

          {searchEmails.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center">
              <EmptyState />
            </div>
          )}

          {searchEmails.length > 0 && (
            <div className="-mx-3 z-40 flex flex-col flex-1 overflow-y-auto min-h-0">
              <SearchEmailList
                loading={isLoadingSearchEmails}
                mails={searchEmails}
                onMailSelected={handleMessageSelected}
                onLoadMore={onLoadMore}
                hasMoreItems={hasMoreEmails}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
