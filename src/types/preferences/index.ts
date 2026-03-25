export type PreferencesSection = 'general';

export interface PreferencesSectionItem {
  id: PreferencesSection;
  group?: string;
}

export const PREFERENCES_SECTIONS: PreferencesSectionItem[] = [{ id: 'general' }];
