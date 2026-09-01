import { useTranslationContext } from '@/i18n';
import { Avatar } from '@internxt/ui';

interface UpgradeRequiredProps {
  userFullName: string;
}

export const UpgradeRequired = ({ userFullName }: UpgradeRequiredProps) => {
  const { translate } = useTranslationContext();

  return (
    <div className="flex flex-col gap-5 justify-center items-center">
      {/* Avatar */}
      <div className="flex flex-col">
        <Avatar fullName={userFullName} diameter={80} />
      </div>

      {/* Title and description */}
      <div className="flex flex-col text-center">
        <h1 className="text-2xl font-medium text-gray-100">{translate('identitySetup.upgradeRequired.title')}</h1>
        <p className="text-gray-80 mt-4">{translate('identitySetup.upgradeRequired.description')}</p>
      </div>
    </div>
  );
};
