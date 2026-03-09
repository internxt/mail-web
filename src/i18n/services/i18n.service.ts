import { initReactI18next } from 'react-i18next';
import i18next from 'i18next';

import dayjs from 'dayjs';
import en from 'dayjs/locale/en';

import enJson from '../locales/en.json';

const dayJsLocale: Record<string, ILocale> = {
  en,
};

const deviceLang: string =
  localStorage.getItem('i18nextLng') ?? navigator.language.split('-')[0];

dayjs.locale(dayJsLocale[deviceLang] || dayJsLocale['en']);

export default i18next.use(initReactI18next).init({
  resources: {
    en: { translation: enJson },
  },
  debug: true,
  fallbackLng: 'en',
  detection: {
    order: ['querystring', 'navigator', 'localStorage', 'cookie'],
    caches: ['localStorage', 'cookie'],
  },
  defaultNS: 'translation',
  ns: ['translation'],
  interpolation: {
    escapeValue: false,
  },
});
