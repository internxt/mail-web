import type { Theme } from '@/context/theme/types';
import { useTranslationContext } from '@/i18n';

interface ThemeButtonProps {
  theme: Theme;
  toggleTheme: (theme: Theme) => void;
  isSelected: boolean;
  img: string;
}

const ThemeButton = ({ theme, toggleTheme, isSelected, img }: ThemeButtonProps) => {
  const { translate } = useTranslationContext();

  return (
    <button
      className={'mr-4 flex w-36 flex-col space-y-1 rounded-xl'}
      onClick={() => {
        toggleTheme(theme);
      }}
    >
      <div
        className={`box-border overflow-hidden rounded-xl ${
          isSelected
            ? 'border-2 border-primary  outline-4 outline-primary/10 drop-shadow'
            : 'border-2 border-transparent'
        }`}
      >
        <img src={img} alt={theme} draggable={false} />
      </div>

      <span className={`text-sm font-medium ${isSelected ? '' : 'text-gray-50'}`}>
        {translate(`modals.preferences.sections.general.appearance.${theme}`)}
      </span>
    </button>
  );
};

export default ThemeButton;
