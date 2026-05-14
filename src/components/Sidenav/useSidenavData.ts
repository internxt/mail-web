import { useGetStorageLimitQuery, useGetStorageUsageQuery } from '@/store/api/storage';
import { useGetMailMeQuery } from '@/store/api/mail';
import { getDaysUntil } from '@/utils/days-until';

export const useSidenavData = () => {
  const { isLoading: isLoadingPlanLimit, data: planLimit = 0 } = useGetStorageLimitQuery();
  const { isLoading: isLoadingPlanUsage, data: planUsage = 0 } = useGetStorageUsageQuery();
  const { data: mailMe } = useGetMailMeQuery();

  const isMailDisabled = mailMe?.status === 'suspended';
  const daysUntilDeletion = getDaysUntil(mailMe?.deletionAt);
  const storagePercentage = planLimit > 0 ? Math.min((planUsage / planLimit) * 100, 100) : 0;

  return {
    mailMe,
    isMailDisabled,
    daysUntilDeletion,
    planLimit,
    planUsage,
    isLoadingPlanLimit,
    isLoadingPlanUsage,
    storagePercentage,
  };
};
