import { ArrowSquareOutIcon, type Icon } from '@phosphor-icons/react';

export type PreferencesSection = 'general' | 'account';

export interface PreferencesSectionItem {
  id: PreferencesSection;
  group?: string;
  icon?: Icon;
}

export const PREFERENCES_SECTIONS: PreferencesSectionItem[] = [
  { id: 'general' },
  { id: 'account', group: 'account', icon: ArrowSquareOutIcon },
];
