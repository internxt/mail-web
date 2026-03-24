import type { PreferencesSection, PreferencesSectionItem } from '@/types/preferences';
import SectionItem from './SectionItem';

interface SectionListProps {
  sectionItems: (PreferencesSectionItem & { text: string })[];
  activeSection: PreferencesSection;
  onSelectSection: (section: PreferencesSection) => void;
}

const SectionList = ({ sectionItems, activeSection, onSelectSection }: SectionListProps) => {
  return (
    <div className="overflow-x-auto">
      {sectionItems.map((item) => (
        <SectionItem
          key={item.id}
          text={item.text}
          isActive={item.id === activeSection}
          onClick={() => onSelectSection(item.id)}
        />
      ))}
    </div>
  );
};

export default SectionList;
