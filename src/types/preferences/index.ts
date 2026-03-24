export type PreferencesSection = 'general';
export type PreferencesSubsection = 'general';

export interface PreferencesSectionItem {
  section: PreferencesSection;
  subsection: PreferencesSubsection;
  isSubsection?: boolean;
}

export interface PreferencesActivePath {
  section: PreferencesSection;
  subsection: PreferencesSubsection;
}

export const PREFERENCES_DEFAULT_SECTIONS: PreferencesSectionItem[] = [
  {
    section: 'general',
    subsection: 'general',
  },
];
