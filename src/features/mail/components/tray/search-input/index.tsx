import { useTranslationContext } from '@/i18n';
import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import { useHotkeys } from 'react-hotkeys-hook';
import { isMacOs } from 'react-device-detect';
import ContactInput from './filters/contact-input';
import DateFilter from './filters/date-filter';
import FilterItem from './filters/filter-item';
import EmptyState from './components/empty-state';
import type { FilterId } from './types';
import { useSearchFilters } from './hooks/useSearchFilters';
import { Activity } from 'react';

const SearchInput = () => {
  const { translate } = useTranslationContext();

  const {
    searchInput,
    openSearchBox,
    setOpenSearchBox,
    query,
    setQuery,
    setPreventBlur,
    activeFilters,
    expandedFilter,
    filterOffsetLeft,
    fromEmails,
    toEmails,
    datePreset,
    afterDate,
    beforeDate,
    handleFilterToggle,
    handleAddEmail,
    handleRemoveEmail,
    handleDatePreset,
    handleAfterDate,
    handleBeforeDate,
    handleBlur,
  } = useSearchFilters();

  useHotkeys(
    ['Meta+F', 'Control+F'],
    (e) => {
      e.preventDefault();
      searchInput.current?.focus();
    },
    [openSearchBox],
    { enableOnFormTags: ['INPUT'] },
  );

  const filterItems: { id: FilterId; label: string }[] = [
    { id: 'from', label: translate('search.filters.from') },
    { id: 'to', label: translate('search.filters.to') },
    { id: 'date', label: translate('search.filters.date') },
    { id: 'hasAttachments', label: translate('search.filters.hasAttachments') },
    { id: 'unread', label: translate('search.filters.unread') },
  ];

  const handleSubmit = (e: React.BaseSyntheticEvent) => {
    e.preventDefault();

    if (!query) return;

    // !TODO: Add search logic
  };

  const dropdownClassName = (() => {
    const base =
      'absolute top-12 z-20 w-screen max-w-160 h-screen max-h-80 origin-top rounded-xl bg-surface text-gray-100 shadow-subtle-hard ring-1 ring-gray-10 transition-all duration-150 ease-out dark:bg-gray-5';
    if (openSearchBox) return `${base} translate-y-1.5 scale-100 opacity-100`;
    return `${base} pointer-events-none -translate-y-0.5 scale-[0.98] opacity-0`;
  })();

  const contactFilter = expandedFilter === 'from' || expandedFilter === 'to' ? expandedFilter : null;
  const currentEmails = expandedFilter === 'from' ? fromEmails : toEmails;

  return (
    <form className="relative flex h-full w-full items-center" onSubmit={handleSubmit}>
      <label className="relative flex w-full items-center" htmlFor="globalSearchInput">
        <MagnifyingGlassIcon
          className="pointer-events-none absolute left-2.5 top-1/2 z-1 -translate-y-1/2 text-gray-60"
          size={20}
        />
        <input
          ref={searchInput}
          id="globalSearchInput"
          data-cy="globalSearchInput"
          autoComplete="off"
          spellCheck="false"
          type="text"
          value={query}
          className="h-10 w-full appearance-none rounded-lg border border-transparent bg-gray-5 pl-9 pr-9 text-base text-gray-100 placeholder-gray-60 outline-none ring-1 ring-gray-10 transition-all duration-150 ease-out hover:shadow-sm hover:ring-gray-20 focus:border-primary focus:bg-surface focus:placeholder-gray-80 focus:shadow-none focus:ring-3 focus:ring-primary/10 dark:focus:bg-gray-1 dark:focus:ring-primary/20"
          onKeyUp={(e) => {
            if (e.key === 'Escape') e.currentTarget.blur();
          }}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpenSearchBox(true)}
          onBlur={handleBlur}
          placeholder={translate('actions.search')}
        />
        <div
          className={`pointer-events-none absolute right-2.5 top-1/2 z-1 -translate-y-1/2 rounded-md bg-gray-10 px-2 py-1 text-sm text-gray-50 transition-opacity duration-100 ${openSearchBox ? 'opacity-0' : ''}`}
        >
          {isMacOs ? '⌘F' : 'Ctrl F'}
        </div>
        <button
          type="button"
          onClick={() => setQuery('')}
          className={`absolute right-2.5 top-1/2 z-1 -translate-y-1/2 cursor-pointer text-gray-60 transition-all duration-100 ease-out ${query.length === 0 ? 'pointer-events-none opacity-0' : ''}`}
        >
          <XIcon size={20} />
        </button>
      </label>

      <div
        role="none"
        className={dropdownClassName}
        onMouseEnter={() => setPreventBlur(true)}
        onMouseLeave={() => setPreventBlur(false)}
      >
        <div className="flex h-full w-full flex-col gap-3 px-3 py-3">
          <div className="relative flex flex-wrap items-center gap-1.5">
            {filterItems.map((item) => (
              <FilterItem
                key={item.id}
                id={item.id}
                label={item.label}
                activeFilters={activeFilters}
                expandedFilter={expandedFilter}
                onToggle={handleFilterToggle}
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
          </div>

          {!query && (
            <div className="flex flex-1 flex-col items-center justify-center">
              <EmptyState />
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default SearchInput;
