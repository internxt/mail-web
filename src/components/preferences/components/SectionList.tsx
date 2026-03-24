import type { PreferencesActivePath, PreferencesSectionItem } from '@/types/preferences';
import SectionItem from './SectionItem';

interface SectionListProps {
  sectionItems: (PreferencesSectionItem & { text: string })[];
  activePath: PreferencesActivePath;
  onSelectSection: (path: PreferencesActivePath) => void;
}

const SectionList = ({ sectionItems, activePath, onSelectSection }: SectionListProps) => {
  return (
    <div className="overflow-x-auto">
      {sectionItems.map((item) => {
        const isActive = item.section === activePath.section && item.subsection === activePath.subsection;

        return (
          <SectionItem
            key={`${item.section}-${item.subsection}`}
            text={item.text}
            isActive={isActive}
            isSubsection={item.isSubsection}
            onClick={() => onSelectSection({ section: item.section, subsection: item.subsection })}
          />
        );
      })}
    </div>
  );
};

export default SectionList;
