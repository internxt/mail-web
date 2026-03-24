import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import {
  PREFERENCES_DEFAULT_SECTIONS,
  type PreferencesActivePath,
  type PreferencesSection,
  type PreferencesSubsection,
} from '@/types/preferences';

const DEFAULT_SECTION: PreferencesActivePath = {
  section: 'general',
  subsection: 'general',
};

const isValidSection = (value: string): value is PreferencesSection => {
  return PREFERENCES_DEFAULT_SECTIONS.some((item) => item.section === value);
};

const isValidSubsection = (section: string, value: string): value is PreferencesSubsection => {
  return PREFERENCES_DEFAULT_SECTIONS.some((item) => item.section === section && item.subsection === value);
};

export const usePreferencesNavigation = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const isOpen = searchParams.get('preferences') === 'open';

  const activePath: PreferencesActivePath = useMemo(() => {
    const section = searchParams.get('section');
    const subsection = searchParams.get('subsection');

    if (section && isValidSection(section) && subsection && isValidSubsection(section, subsection)) {
      return { section, subsection };
    }

    return DEFAULT_SECTION;
  }, [searchParams]);

  const openSection = useCallback(
    ({ section, subsection }: PreferencesActivePath) => {
      setSearchParams({ preferences: 'open', section, subsection }, { replace: true });
    },
    [setSearchParams],
  );

  const close = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  return { isOpen, activePath, openSection, close };
};
