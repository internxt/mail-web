import { type ReactNode, useState } from 'react';
import dayjs from 'dayjs';
import i18next from 'i18next';
import { Card } from '@internxt/ui';
import { CaretDownIcon } from '@phosphor-icons/react';
import PreferenceSectionLayout from '../PreferenceSectionLayout';
import { useTranslationContext } from '@/i18n';
import LanguageDropdown from './language-dropdown';
import { LocalStorageService } from '@/services/local-storage';

const languages = ['en', 'es', 'fr', 'it'];

const sanitizeLanguage = (language: string): string => {
  return language.toLowerCase().includes('en') ? 'en' : language;
};

const getInitialLanguage = (): string => {
  const formattedLang = i18next.language.split('-')[0];
  const stored = LocalStorageService.instance.get('i18nextLng')?.split('-')[0];
  return sanitizeLanguage(stored ?? formattedLang);
};

const Language = () => {
  const { translate } = useTranslationContext();
  const [lang, setLang] = useState<string>(getInitialLanguage);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const onToggleDropdownButton = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const onChangeLanguage = (updatedLanguage: string) => {
    setLang(updatedLanguage);
    void i18next.changeLanguage(updatedLanguage);
    dayjs.locale(updatedLanguage);
    closeDropdown();
  };

  return (
    <PreferenceSectionLayout className="z-10" title={translate('modals.preferences.sections.general.language.title')}>
      <Card className="w-fit py-3 dark:bg-gray-5">
        <LanguageDropdown
          title={
            <div className="flex flex-row items-center justify-between space-x-2">
              <p className="text-base font-medium leading-5">
                {translate(`modals.preferences.sections.general.language.${lang}`)}
              </p>
              <CaretDownIcon size={10} />
            </div>
          }
          isOpen={isDropdownOpen}
          onToggle={onToggleDropdownButton}
          menuItems={languages.map((lang) => (
            <MenuItem key={lang} onClick={() => onChangeLanguage(lang)}>
              <p>{translate(`modals.preferences.sections.general.language.${lang}`)}</p>
            </MenuItem>
          ))}
        />
      </Card>
    </PreferenceSectionLayout>
  );
};

const MenuItem = ({ children, onClick }: { children: ReactNode; onClick: () => void }) => (
  <button
    onKeyDown={() => {}}
    className={'flex h-full w-full cursor-pointer px-2 py-2 text-gray-80 hover:bg-gray-5 active:bg-gray-10'}
    onClick={() => {
      onClick();
    }}
  >
    {children}
  </button>
);

export default Language;
