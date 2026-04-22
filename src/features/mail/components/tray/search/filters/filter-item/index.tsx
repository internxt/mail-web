import { CaretDownIcon, XIcon } from '@phosphor-icons/react';
import type { FilterId } from '../../types';

interface FilterPillProps {
  id: FilterId;
  label: string;
  activeFilters: FilterId[];
  expandedFilter: FilterId | null;
  onToggle: (id: FilterId, offsetLeft: number) => void;
}

const FilterItem = ({ id, label, activeFilters, expandedFilter, onToggle }: FilterPillProps) => {
  const isActive = activeFilters.includes(id);
  const hasDropdown = id === 'from' || id === 'to' || id === 'date';
  const isExpanded = hasDropdown && expandedFilter === id;

  return (
    <button
      type="button"
      onClick={(e) => onToggle(id, (e.currentTarget as HTMLButtonElement).offsetLeft)}
      className={`flex h-7 items-center gap-1 rounded-full border px-2.5 text-sm font-medium transition-all duration-100 ${
        isActive
          ? 'border-primary/30 bg-primary/10 text-primary'
          : 'border-gray-10 bg-surface text-gray-60 hover:border-gray-20 hover:bg-gray-5 dark:bg-gray-5 dark:hover:bg-gray-10'
      }`}
    >
      <span>{label}</span>
      {hasDropdown && (
        <CaretDownIcon
          size={12}
          weight="bold"
          className={`transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`}
        />
      )}
      {isActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(id, 0);
          }}
        >
          <XIcon size={12} className="ml-0.5 opacity-60 hover:opacity-100" />
        </button>
      )}
    </button>
  );
};

export default FilterItem;
