import { useTranslationContext } from '@/i18n';
import Section from '../../components/Section';

const GeneralSection = ({ onClose }: { onClose: () => void }) => {
  const { translate } = useTranslationContext();
  return (
    <Section className="max-w-2xl" title={translate('modals.preferences.sections.general.title')} onClose={onClose}>
      {/* TODO: Add appearance, language and support components */}
      <p>{translate('modals.preferences.sections.general.title')}</p>
    </Section>
  );
};

export default GeneralSection;
