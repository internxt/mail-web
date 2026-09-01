import { useTranslationContext } from '@/i18n';
import notificationsService, { ToastType } from '@/services/notifications';
import { useGetMailAccountKeysQuery } from '@/store/api/mail';
import { CopyIcon } from '@phosphor-icons/react';
import PreferenceSectionLayout from '../PreferenceSectionLayout';

const Account = () => {
  const { translate } = useTranslationContext();
  const { data: mailAccountKeys } = useGetMailAccountKeysQuery();

  const mailAddress = mailAccountKeys?.address;

  if (!mailAddress) return null;

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(mailAddress);
    notificationsService.show({ text: translate('toastNotification.textCopied'), type: ToastType.Success });
  };

  return (
    <PreferenceSectionLayout title={translate('modals.preferences.sections.general.account.title')}>
      <div className="flex w-fit flex-row items-center gap-4">
        <span className="text-base text-gray-80">{mailAddress}</span>
        <button type="button" onClick={handleCopyAddress} className="text-gray-50 transition-colors hover:text-gray-80">
          <CopyIcon size={20} />
        </button>
      </div>
    </PreferenceSectionLayout>
  );
};

export default Account;
