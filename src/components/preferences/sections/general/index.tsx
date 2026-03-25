import { useTranslationContext } from '@/i18n';
import PreferencesSection from '../../components/PreferencesSection';
import Appearance from './components/appearance';
import Language from './components/language';
import Support from './components/support';

const GeneralSection = ({ onClose }: { onClose: () => void }) => {
  const { translate } = useTranslationContext();
  return (
    <PreferencesSection
      className="max-w-2xl"
      title={translate('modals.preferences.sections.general.title')}
      onClose={onClose}
    >
      <Appearance />
      <Language />
      <Support />
    </PreferencesSection>
  );
};

export default GeneralSection;
