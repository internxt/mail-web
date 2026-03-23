import { useState } from 'react';

import { Button, Sidenav as SidenavComponent } from '@internxt/ui';
import logo from '../../assets/logos/Internxt/small-logo.svg';
import { useTranslationContext } from '@/i18n';
import { NavigationService } from '@/services/navigation';
import { AppView } from '@/routes/paths';
import type { RootState } from '@/store';
import { HUNDRED_TB } from '@/constants';
import { useSuiteLauncher } from '@/hooks/navigation/useSuiteLauncher';
import { useSidenavNavigation } from '@/hooks/navigation/useSidenavNavigation';
import { useGetStorageLimitQuery, useGetStorageUsageQuery } from '@/store/queries/storage/storage.query';
import { useAppSelector } from '@/store/hooks';
import { bytesToString } from '@/utils/bytesToString';
import { ActionDialog, useActionDialog } from '@/context/dialog-manager';

const Sidenav = () => {
  const { translate } = useTranslationContext();
  const { userSubscription: subscription } = useAppSelector((state: RootState) => state.user);
  const { isLoading: isLoadingPlanLimit, data: planLimit = 1 } = useGetStorageLimitQuery();
  const { isLoading: isLoadingPlanUsage, data: planUsage = 0 } = useGetStorageUsageQuery();
  const storagePercentage = planLimit > 0 ? Math.min((planUsage / planLimit) * 100, 100) : 0;
  const { openDialog } = useActionDialog();

  const { itemsNavigation } = useSidenavNavigation();
  const { suiteArray } = useSuiteLauncher();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const savedState = sessionStorage.getItem('sidenav-collapsed');
    return savedState === 'true';
  });

  const onLogoClicked = () => {
    NavigationService.instance.navigate({
      id: AppView.Inbox,
    });
  };

  const isUpgradeAvailable = () => {
    const isLifetimeAvailable = subscription?.type === 'lifetime' && planLimit < HUNDRED_TB;

    return subscription?.type === 'free' || isLifetimeAvailable;
  };

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const newValue = !prev;
      sessionStorage.setItem('sidenav-collapsed', String(newValue));
      return newValue;
    });
  };

  const onPrimaryActionClicked = () => {
    openDialog(ActionDialog.ComposeMessage);
  };

  return (
    <div className="flex flex-col h-screen z-50">
      <SidenavComponent
        header={{
          logo: logo,
          title: translate('mail.title'),
          onClick: onLogoClicked,
          className: '!pt-0 pb-3',
        }}
        primaryAction={
          <Button className="w-full" variant="primary" onClick={onPrimaryActionClicked}>
            {translate('actions.newMessage')}
          </Button>
        }
        suiteLauncher={{
          suiteArray: suiteArray,
          soonText: translate('modals.upgradePlanDialog.soonBadge'),
        }}
        options={itemsNavigation}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        storage={{
          usage: bytesToString({ size: planUsage }),
          limit: bytesToString({ size: planLimit }),
          percentage: storagePercentage,
          onUpgradeClick: () => {},
          upgradeLabel: isUpgradeAvailable() ? translate('actions.upgrade') : undefined,
          isLoading: isLoadingPlanUsage || isLoadingPlanLimit,
        }}
      />
    </div>
  );
};

export default Sidenav;
