import { useTranslationContext } from '@/i18n';
import PreferencesSection from '../../components/PreferencesSection';
import Appearance from './components/appearance';

const GeneralSection = ({ onClose }: { onClose: () => void }) => {
  const { translate } = useTranslationContext();
  return (
    <PreferencesSection
      className="max-w-2xl"
      title={translate('modals.preferences.sections.general.title')}
      onClose={onClose}
    >
      {/* TODO: Add language and support components */}
      <Appearance />
    </PreferencesSection>
  );
};

export default GeneralSection;
