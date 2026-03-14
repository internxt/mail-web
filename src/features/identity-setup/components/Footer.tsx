import { CONTACT_SUPPORT_URL, TERMS_AND_CONDITIONS_URL } from '@/constants';
import { useTranslationContext } from '@/i18n';

export const Footer = () => {
  const { translate } = useTranslationContext();

  return (
    <div className="flex flex-row justify-center items center w-full gap-8">
      <a href={TERMS_AND_CONDITIONS_URL} target="_blank" rel="noopener noreferrer">
        <p className="text-gray-50">{translate('identitySetup.termsAndConditions')}</p>
      </a>
      <a href={CONTACT_SUPPORT_URL} target="_blank" rel="noopener noreferrer">
        <p className="text-gray-50">{translate('identitySetup.contactSupport')}</p>
      </a>
    </div>
  );
};
