import { useThemeContext } from '@/context/theme/useThemeContext';
import { useTranslationContext } from '@/i18n';
import appearance_dark from '@/assets/appearance/dark.svg';
import appearance_light from '@/assets/appearance/light.svg';
import appearance_system from '@/assets/appearance/system.svg';
import PreferenceSectionLayout from '../PreferenceSectionLayout';
import ThemeButton from './theme-button';
import type { Theme } from '@/context/theme/types';

const themes = [
  { theme: 'system', img: appearance_system },
  { theme: 'light', img: appearance_light },
  { theme: 'dark', img: appearance_dark },
];

const Appearance = () => {
  const { translate } = useTranslationContext();
  const { currentTheme, toggleTheme } = useThemeContext();

  return (
    <PreferenceSectionLayout title={translate('modals.preferences.sections.general.appearance.title')}>
      <div className="flex flex-col w-full h-max overflow-x-auto">
        <div className="flex flex-row w-max h-max pb-2">
          {themes.map((themeInfo) => (
            <ThemeButton
              key={themeInfo.theme}
              theme={themeInfo.theme as Theme}
              toggleTheme={toggleTheme}
              isSelected={currentTheme === themeInfo.theme}
              img={themeInfo.img}
            />
          ))}
        </div>
      </div>
    </PreferenceSectionLayout>
  );
};

export default Appearance;
