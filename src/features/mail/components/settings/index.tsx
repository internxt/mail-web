import { usePreferencesNavigation } from '@/hooks/preferences/usePreferencesNavigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useGetStorageLimitQuery, useGetStorageUsageQuery } from '@/store/queries/storage/storage.query';
import { Button } from '@internxt/ui';
import { GearIcon } from '@phosphor-icons/react';
import AccountPopover from './components/account-popover';
import { logoutThunk } from '@/store/slices/user/thunks';

const Settings = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);
  const { data: usage } = useGetStorageUsageQuery();
  const { data: limit } = useGetStorageLimitQuery();
  const { openSection } = usePreferencesNavigation();

  const percentageUsed = usage != null && limit ? Math.round((usage / limit) * 100) : 0;

  if (!user) return null;

  const openPreferences = () => {
    openSection('general');
  };

  const onLogout = () => {
    dispatch(logoutThunk());
  };

  return (
    <div className="flex flex-row w-full gap-1 items-center justify-end p-4">
      <Button variant="ghost" onClick={openPreferences}>
        <GearIcon size={24} />
      </Button>
      <AccountPopover
        user={user}
        percentageUsed={percentageUsed}
        openPreferences={openPreferences}
        onLogout={onLogout}
      />
    </div>
  );
};

export default Settings;
