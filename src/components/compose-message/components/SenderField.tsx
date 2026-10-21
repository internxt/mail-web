import { useTranslationContext } from '@/i18n';
import { useAppSelector } from '@/store/hooks';
import { useGetMailAccountKeysQuery } from '@/store/api/mail';

export const SenderField = () => {
  const { translate } = useTranslationContext();
  const user = useAppSelector((state) => state.user.user);
  const { data: mailAccountKeys } = useGetMailAccountKeysQuery();

  const address = mailAccountKeys?.address;
  if (!address) return null;

  const fullName = [user?.name, user?.lastname]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex flex-row gap-2 items-center">
      <p className="font-medium max-w-16 w-full text-gray-100">{translate('modals.composeMessageDialog.from')}</p>
      <p className="min-w-0 truncate text-gray-100" data-testid="compose-sender">
        {fullName ? (
          <>
            {fullName} <span className="text-gray-60">&lt;{address}&gt;</span>
          </>
        ) : (
          address
        )}
      </p>
    </div>
  );
};
