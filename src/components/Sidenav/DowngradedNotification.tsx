import { WarningIcon } from '@phosphor-icons/react';
import { useTranslationContext } from '@/i18n';

interface DowngradedNotificationProps {
  daysUntilDeletion?: number;
  onUpgradeClick: () => void;
}

const DowngradedNotification = ({ daysUntilDeletion, onUpgradeClick }: DowngradedNotificationProps) => {
  const { translate } = useTranslationContext();

  return (
    <div className="flex gap-1.5 items-start p-3 rounded-lg bg-yellow/10 border border-yellow/20">
      <WarningIcon className="size-5 shrink-0 text-yellow" weight="fill" />
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-xs leading-tight text-gray-100">
          {translate('mailDowngraded.message', { days: daysUntilDeletion ?? '--' })}
        </p>
        <button
          type="button"
          onClick={onUpgradeClick}
          className="self-start text-xs font-medium text-primary hover:underline"
        >
          {translate('mailDowngraded.upgrade')}
        </button>
      </div>
    </div>
  );
};

export default DowngradedNotification;
