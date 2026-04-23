import { useTranslationContext } from '@/i18n';
import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import { isMacOs } from 'react-device-detect';

export interface SearchInputProps {
  searchQuery: string;
  searchInput: React.RefObject<HTMLInputElement | null>;
  openSearchBox: boolean;
  onSearchQueryChanges: (query: string) => void;
  setOpenSearchBox: (open: boolean) => void;
  handleBlur: () => void;
}

const SearchInput = ({
  searchQuery,
  searchInput,
  openSearchBox,
  onSearchQueryChanges,
  setOpenSearchBox,
  handleBlur,
}: SearchInputProps) => {
  const { translate } = useTranslationContext();

  return (
    <div className="relative flex w-full items-center">
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
        value={searchQuery}
        className="h-10 w-full appearance-none rounded-lg border border-transparent bg-gray-5 pl-9 pr-9 text-base text-gray-100 placeholder-gray-60 outline-none ring-1 ring-gray-10 transition-all duration-150 ease-out hover:shadow-sm hover:ring-gray-20 focus:border-primary focus:bg-surface focus:placeholder-gray-80 focus:shadow-none focus:ring-3 focus:ring-primary/10 dark:focus:bg-gray-1 dark:focus:ring-primary/20"
        onKeyUp={(e) => {
          if (e.key === 'Escape') e.currentTarget.blur();
        }}
        onChange={(e) => onSearchQueryChanges(e.target.value)}
        onFocus={() => setOpenSearchBox(true)}
        onBlur={handleBlur}
        placeholder={translate('actions.search')}
      />
      <div
        className={`pointer-events-none absolute right-2.5 top-1/2 z-1 -translate-y-1/2 rounded-md bg-gray-10 px-2 py-1 text-sm text-gray-50 transition-opacity duration-100 ${openSearchBox || searchQuery.length > 0 ? 'opacity-0' : ''}`}
      >
        {isMacOs ? '⌘F' : 'Ctrl F'}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onSearchQueryChanges('');
        }}
        className={`absolute right-2.5 top-1/2 z-1 -translate-y-1/2 cursor-pointer text-gray-60 transition-all duration-100 ease-out ${searchQuery.length === 0 ? 'pointer-events-none opacity-0' : ''}`}
      >
        <XIcon size={20} />
      </button>
    </div>
  );
};

export default SearchInput;
