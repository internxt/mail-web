import { useTranslationContext } from '@/i18n';
import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import { useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { isMacOs } from 'react-device-detect';

const getKeyboardShortcutClassName = (openSearchBox: boolean) => {
  const baseClass =
    'pointer-events-none absolute right-2.5 top-1/2 z-1 -translate-y-1/2 rounded-md bg-gray-10 px-2 py-1 text-sm text-gray-50';
  const visibilityClass = openSearchBox ? 'opacity-0' : '';
  return `${baseClass} ${visibilityClass}`;
};

const getClearButtonClassName = (query: string, openSearchBox: boolean) => {
  const baseClass =
    'absolute right-2.5 top-1/2 z-1 -translate-y-1/2 cursor-pointer text-gray-60 transition-all duration-100 ease-out';
  const isHidden = query.length === 0 || !openSearchBox;
  const visibilityClass = isHidden ? 'pointer-events-none opacity-0' : '';
  return `${baseClass} ${visibilityClass}`;
};

const getSearchBoxClassName = (openSearchBox: boolean) => {
  const baseClass = 'relative flex w-full items-center rounded-lg transition-all duration-150 ease-out';
  const widthClass = openSearchBox ? 'max-w-screen-sm' : 'max-w-sm';
  return `${baseClass} ${widthClass}`;
};

const SearchInput = () => {
  const { translate } = useTranslationContext();
  const searchInput = useRef<HTMLInputElement>(null);
  const [openSearchBox, setOpenSearchBox] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');

  useHotkeys(
    ['Meta+F', 'Control+F'],
    (e) => {
      e.preventDefault();
      searchInput.current?.focus();
    },
    [openSearchBox],
    { enableOnFormTags: ['INPUT'] },
  );

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <form className="relative flex h-full w-full items-center" onSubmitCapture={handleSubmit}>
      <label className={getSearchBoxClassName(openSearchBox)} htmlFor="globalSearchInput">
        <MagnifyingGlassIcon
          className="pointer-events-none absolute left-2.5 top-1/2 z-1 -translate-y-1/2 text-gray-60 focus-within:text-gray-80"
          size={20}
        />
        <input
          ref={searchInput}
          id="globalSearchInput"
          data-cy="globalSearchInput"
          autoComplete="off"
          spellCheck="false"
          type="text"
          className="inxt-input left-icon h-10 w-full appearance-none rounded-lg border border-transparent bg-gray-5 px-9 text-lg text-gray-100 placeholder-gray-60 outline-none ring-1 ring-gray-10 transition-all duration-150 ease-out hover:shadow-sm hover:ring-gray-20 focus:border-primary focus:bg-surface focus:placeholder-gray-80 focus:shadow-none focus:ring-3 focus:ring-primary/10 dark:focus:bg-gray-1 dark:focus:ring-primary/20"
          onKeyUpCapture={(e) => {
            if (e.key === 'Escape') {
              e.currentTarget.blur();
            }
          }}
          onChange={(e) => setQuery(e.target.value)}
          onBlurCapture={() => {
            setOpenSearchBox(false);
          }}
          onFocusCapture={() => setOpenSearchBox(true)}
          placeholder={translate('actions.search')}
        />
        <div className={getKeyboardShortcutClassName(openSearchBox)}>{isMacOs ? '⌘F' : 'Ctrl F'}</div>
        <XIcon className={getClearButtonClassName(query, openSearchBox)} size={20} />
      </label>
    </form>
  );
};

export default SearchInput;
