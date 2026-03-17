import { Checkbox, Dropdown, type MenuItemType } from '@internxt/ui';
import { SearchComponent } from '../searchComponent';
import { CaretDownIcon, DotsThreeVerticalIcon, FunnelSimpleIcon, XIcon } from '@phosphor-icons/react';
import { useTranslationContext } from '@/i18n';

interface HeaderProps {
  folderName: string;
}

const Header = ({ folderName }: HeaderProps) => {
  const { translate } = useTranslationContext();

  const listActionContext: MenuItemType<unknown>[] = [
    {
      name: translate('filter.all'),
      action: () => {},
    },
    {
      name: translate('filter.none'),
      action: () => {},
    },
    {
      name: translate('filter.read'),
      action: () => {},
    },
    {
      name: translate('filter.unread'),
      action: () => {},
    },
    {
      name: translate('filter.starred'),
      action: () => {},
    },
    {
      name: translate('filter.unstarred'),
      action: () => {},
    },
  ];

  const bulkActionContext: MenuItemType<unknown>[] = [
    {
      name: translate('actions.trashAll'),
      action: () => {},
      icon: XIcon,
    },
    {
      name: translate('actions.archiveAll'),
      action: () => {},
      icon: XIcon,
    },
  ];

  return (
    <section className="flex flex-col w-full">
      <div className="py-3 flex w-full px-5">
        <SearchComponent />
      </div>
      <div className="flex flex-row w-full justify-between px-5 py-3 z-10">
        <div className="flex flex-row gap-2 items-center">
          <div className="flex flex-row gap-1">
            <Checkbox />
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
          <FunnelSimpleIcon size={24} />
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

export default Header;
