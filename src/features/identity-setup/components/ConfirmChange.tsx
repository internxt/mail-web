import { useTranslationContext } from '@/i18n';
import { Avatar, Button } from '@internxt/ui';

interface ConfirmChangeProps {
  userFullName: string;
  userNewEmail: string;
  userOldEmail: string;
  onConfirmChanges: () => void;
}

export const ConfirmChange = ({ userOldEmail, userNewEmail, userFullName, onConfirmChanges }: ConfirmChangeProps) => {
  const { translate } = useTranslationContext();

  return (
    <div className="flex flex-col gap-5 justify-center items-center">
      {/* Avatar */}
      <div className="flex flex-col">
        <Avatar fullName={userFullName} diameter={80} />
      </div>

      {/* Title and description */}
      <div className="flex flex-col text-center">
        <h1 className="text-2xl font-medium text-gray-100">{translate('identitySetup.confirmChanges.title')}</h1>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col ">
            <p className="text-gray-80">{translate('identitySetup.confirmChanges.newEmail')}</p>
            <p className="font-bold">{userNewEmail}</p>
          </div>
          <div className="flex flex-col text-gray-80">
            <p>{translate('identitySetup.confirmChanges.recoveryEmail')}</p>
            <p>{userOldEmail}</p>
          </div>
          <p className="text-gray-80">{translate('identitySetup.confirmChanges.description')}</p>
        </div>
      </div>
      <div className="flex border w-full border-gray-10" />

      <div className="flex flex-col w-full">
        <Button onClick={onConfirmChanges}>{translate('identitySetup.confirmChanges.action')}</Button>
      </div>
    </div>
  );
};
