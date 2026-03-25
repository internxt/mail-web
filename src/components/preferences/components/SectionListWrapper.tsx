import { useTranslationContext } from '@/i18n';
import { PREFERENCES_SECTIONS, type PreferencesSection } from '@/types/preferences';
import SectionList from './SectionList';

interface SectionListWrapperProps {
  activeSection: PreferencesSection;
  onSelectSection: (section: PreferencesSection) => void;
}

const SectionListWrapper = ({ activeSection, onSelectSection }: SectionListWrapperProps) => {
  const { translate } = useTranslationContext();

  const sectionItems = PREFERENCES_SECTIONS.map((item) => ({
    ...item,
    text: translate(`modals.preferences.sections.${item.id}.title`),
  }));

  return <SectionList sectionItems={sectionItems} activeSection={activeSection} onSelectSection={onSelectSection} />;
};

export default SectionListWrapper;
