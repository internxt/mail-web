import { useTranslationContext } from '@/i18n';
import { PREFERENCES_DEFAULT_SECTIONS, type PreferencesActivePath } from '@/types/preferences';
import SectionList from './SectionList';

interface SectionListWrapperProps {
  activePath: PreferencesActivePath;
  onSelectSection: (path: PreferencesActivePath) => void;
}

const SectionListWrapper = ({ activePath, onSelectSection }: SectionListWrapperProps) => {
  const { translate } = useTranslationContext();

  const sectionItems = PREFERENCES_DEFAULT_SECTIONS.map((item) => ({
    ...item,
    text: translate(`modals.preferences.sections.${item.subsection ?? item.section}.title`),
  }));

  return <SectionList sectionItems={sectionItems} activePath={activePath} onSelectSection={onSelectSection} />;
};

export default SectionListWrapper;
