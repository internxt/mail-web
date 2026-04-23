import { Checkbox, Dropdown, type MenuItemType } from '@internxt/ui';
import { CaretDownIcon, DotsThreeVerticalIcon, FunnelSimpleIcon } from '@phosphor-icons/react';
import Search from '../search';

interface HeaderProps {
  folderName: string;
  listActionContext: MenuItemType<unknown>[];
  bulkActionContext: MenuItemType<unknown>[];
  isUnreadFilter?: boolean;
  selectedCount: number;
  totalCount: number;
  onCheckboxClicked: () => void;
  onSearchEmailSelected?: (mailId: string, isRead?: boolean) => void;
  onToggleUnreadFilter?: () => void;
}

const TrayHeader = ({
  folderName,
  listActionContext,
  bulkActionContext,
  isUnreadFilter,
  selectedCount,
  totalCount,
  onCheckboxClicked,
  onSearchEmailSelected,
  onToggleUnreadFilter,
}: HeaderProps) => {
  const allSelected = totalCount > 0 && selectedCount === totalCount;
  const someSelected = selectedCount > 0 && selectedCount < totalCount;

  return (
    <section className="flex flex-col w-full">
      <div className="py-3 flex w-full px-5">
        <Search onMailSelected={onSearchEmailSelected} />
      </div>
      <div className="flex flex-row w-full justify-between px-5 py-3 z-10">
        <div className="flex flex-row gap-2 items-center">
          <div className="flex flex-row gap-1">
            <Checkbox checked={allSelected} indeterminate={someSelected} onClick={onCheckboxClicked} />
            <Dropdown
              classMenuItems="left-0 top-1 rounded-lg border border-gray-10 bg-surface dark:bg-gray-5 shadow-subtle-hard text-gray-100"
              openDirection="left"
              dropdownActionsContext={listActionContext}
            >
              {() => <CaretDownIcon weight="fill" size={12} />}
            </Dropdown>
          </div>
          <p className="text-gray-400">{folderName}</p>
        </div>
        <div className="flex flex-row gap-1">
          <button
            type="button"
            onClick={onToggleUnreadFilter}
            className={isUnreadFilter ? 'text-primary' : 'text-gray-60'}
          >
            <FunnelSimpleIcon size={24} />
          </button>
          <Dropdown
            openDirection="left"
            classMenuItems="flex bg-surface border-gray-10 shadow-subtle-hard dark:bg-gray-5 rounded-lg bg-surface text-gray-100"
            dropdownActionsContext={bulkActionContext}
          >
            {() => <DotsThreeVerticalIcon size={24} />}
          </Dropdown>
        </div>
      </div>
    </section>
  );
};

export default TrayHeader;
