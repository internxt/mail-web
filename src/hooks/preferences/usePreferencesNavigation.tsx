import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import { PREFERENCES_SECTIONS, type PreferencesSection } from '@/types/preferences';

const DEFAULT_SECTION: PreferencesSection = 'general';

const isValidSection = (value: string): value is PreferencesSection => {
  return PREFERENCES_SECTIONS.some((item) => item.id === value);
};

export const usePreferencesNavigation = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const isOpen = searchParams.get('preferences') === 'open';

  const activeSection: PreferencesSection = useMemo(() => {
    const section = searchParams.get('section');

    if (section && isValidSection(section)) {
      return section;
    }

    return DEFAULT_SECTION;
  }, [searchParams]);

  const openSection = useCallback(
    (section: PreferencesSection) => {
      setSearchParams({ preferences: 'open', section }, { replace: true });
    },
    [setSearchParams],
  );

  const close = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  return { isOpen, activeSection, openSection, close };
};
