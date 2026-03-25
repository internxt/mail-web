import { useChat } from 'react-live-chat-loader';

import { Button } from '@internxt/ui';
import PreferenceSectionLayout from '../PreferenceSectionLayout';
import { useTranslationContext } from '@/i18n';

const Support = () => {
  const { translate } = useTranslationContext();
  const [, loadChat] = useChat();

  const onClick = () => {
    loadChat({ open: true });
  };

  return (
    <PreferenceSectionLayout title={translate('modals.preferences.sections.general.support.title')}>
      <p className="text-gray-80">{translate('modals.preferences.sections.general.support.description')}</p>
      <Button className="mt-5" variant="secondary" onClick={onClick}>
        {translate('modals.preferences.sections.general.support.cta')}
      </Button>
    </PreferenceSectionLayout>
  );
};

export default Support;
