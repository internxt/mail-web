import { useTranslationContext } from '@/i18n';
import Section from '../../components/Section';
import Appearance from './components/appearance';

const GeneralSection = ({ onClose }: { onClose: () => void }) => {
  const { translate } = useTranslationContext();
  return (
    <Section className="max-w-2xl" title={translate('modals.preferences.sections.general.title')} onClose={onClose}>
      {/* TODO: Add language and support components */}
      <Appearance />
    </Section>
  );
};

export default GeneralSection;
