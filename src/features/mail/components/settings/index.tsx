import { usePreferencesNavigation } from '@/hooks/preferences/usePreferencesNavigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutThunk } from '@/store/slices/user/thunks';
import { Avatar, Button, Dropdown } from '@internxt/ui';
import { GearIcon } from '@phosphor-icons/react';

const Settings = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);
  const { openSection } = usePreferencesNavigation();

  if (!user) return null;

  const openPreferences = () => {
    openSection('general');
  };

  const onLogOut = async () => {
    await dispatch(logoutThunk());
  };

  const dropdownActions = [
    {
      name: 'Settings',
      onClick: openPreferences,
    },
    {
      name: 'Logout',
      onClick: onLogOut,
    },
  ];

  return (
    <div className="flex flex-row w-full gap-1 items-center justify-end p-4">
      <Button variant="ghost" onClick={openPreferences}>
        <GearIcon size={24} />
      </Button>
      <Dropdown classMenuItems="" openDirection="left" dropdownActionsContext={dropdownActions}>
        <Avatar fullName={user.name} src={user.avatar} diameter={40} />
      </Dropdown>
    </div>
  );
};

export default Settings;
