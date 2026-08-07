import { useTranslationContext } from '@/i18n';
import { CaretDownIcon, XIcon } from '@phosphor-icons/react';
import type { FilterId } from '../../types';

interface FilterPillProps {
  id: FilterId;
  label: string;
  value?: string;
  activeFilters: FilterId[];
  expandedFilter: FilterId | null;
  onToggle: (id: FilterId, offsetLeft: number) => void;
  onClear: (id: FilterId) => void;
}

const FilterItem = ({ id, label, value, activeFilters, expandedFilter, onToggle, onClear }: FilterPillProps) => {
  const { translate } = useTranslationContext();
  const isActive = activeFilters.includes(id);
  const hasDropdown = id === 'from' || id === 'to' || id === 'date';
  const isExpanded = hasDropdown && expandedFilter === id;

  const pillClassName = `flex h-7 items-center rounded-full border text-sm font-medium transition-all duration-100 ${
    isActive
      ? 'border-primary/30 bg-primary/10 text-primary'
      : 'border-gray-10 bg-surface text-gray-60 hover:border-gray-20 hover:bg-gray-5 dark:bg-gray-5 dark:hover:bg-gray-10'
  }`;

  return (
    <div className={pillClassName}>
      <button
        type="button"
        aria-expanded={hasDropdown ? isExpanded : undefined}
        onClick={(e) => onToggle(id, (e.currentTarget.parentElement ?? e.currentTarget).offsetLeft)}
        className={`flex h-full max-w-64 items-center gap-1 rounded-full pl-2.5 ${isActive ? 'pr-1' : 'pr-2.5'}`}
      >
        <span className="shrink-0">{label}</span>
        {value && (
          <>
            <span className="opacity-50">·</span>
            <span className="truncate font-normal">{value}</span>
          </>
        )}
        {hasDropdown && (
          <CaretDownIcon
            size={12}
            weight="bold"
            className={`shrink-0 transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`}
          />
        )}
      </button>
      {isActive && (
        <button
          type="button"
          aria-label={translate('search.filters.clear', { filter: label })}
          onClick={() => onClear(id)}
          className="flex h-full items-center rounded-r-full pl-0.5 pr-2"
        >
          <XIcon size={12} className="opacity-60 hover:opacity-100" />
        </button>
      )}
    </div>
  );
};

export default FilterItem;
