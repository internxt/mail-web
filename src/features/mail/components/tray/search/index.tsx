import { useTranslationContext } from '@/i18n';
import { useHotkeys } from 'react-hotkeys-hook';
import ContactInput from './filters/contact-input';
import DateFilter from './filters/date-filter';
import FilterItem from './filters/filter-item';
import EmptyState from './components/empty-state';
import { Activity, useRef, useState } from 'react';
import useEmailSearch from '@/hooks/mail/useEmailSearch';
import SearchInput from './components/search-input';
import SearchEmailList from './components/list';
import { useSearchFilters } from './useSearchFilters';

interface SearchProps {
  onMailSelected?: (id: string, isRead?: boolean) => void;
  onOpenChange?: (open: boolean) => void;
}

const Search = ({ onMailSelected, onOpenChange }: SearchProps) => {
  const { translate } = useTranslationContext();

  const searchInput = useRef<HTMLInputElement>(null);
  const [openSearchBox, setOpenSearchBox] = useState(false);
  const [preventBlur, setPreventBlur] = useState(false);
  const {
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
  } = useSearchFilters();
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

  const changeSearchBoxOpen = (open: boolean) => {
    setOpenSearchBox(open);
    onOpenChange?.(open);
  };

  const closeSearchBox = () => {
    changeSearchBoxOpen(false);
    resetAllFilters();
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

  const dropdownClassName = (() => {
    const base =
      'absolute top-12 z-20 w-screen max-w-160 h-screen max-h-80 origin-top rounded-xl bg-surface text-gray-100 shadow-subtle-hard ring-1 ring-gray-10 transition-all duration-150 ease-out dark:bg-gray-5';
    if (openSearchBox) return `${base} translate-y-1.5 scale-100 opacity-100`;
    return `${base} pointer-events-none -translate-y-0.5 scale-[0.98] opacity-0`;
  })();

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
          onSearchQueryChanges={changeSearchQuery}
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
                value={item.value}
                activeFilters={activeFilters}
                expandedFilter={expandedFilter}
                onToggle={toggleFilter}
                onClear={clearFilter}
              />
            ))}

            <Activity mode={contactFilter ? 'visible' : 'hidden'}>
              <ContactInput
                emails={expandedEmails}
                onAdd={(email) => contactFilter && addEmail(contactFilter, email)}
                onRemove={(email) => contactFilter && removeEmail(contactFilter, email)}
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
                onSelectPreset={changeDatePreset}
                onAfterDate={changeAfterDate}
                onBeforeDate={changeBeforeDate}
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
