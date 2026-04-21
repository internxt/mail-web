import Envelopes from '@/assets/icons/envelopes.svg?react';
import { useTranslationContext } from '@/i18n';

const EmptyState = () => {
  const { translate } = useTranslationContext();

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="-mb-5">
        <Envelopes />
      </div>

      <div className="flex flex-col gap-1 text-center">
        <h2 className="text-xl font-medium text-gray-100">{translate('search.searchEmails.title')}</h2>
        <h3 className="text-sm text-gray-50">{translate('search.searchEmails.description')}</h3>
      </div>
    </div>
  );
};

export default EmptyState;
