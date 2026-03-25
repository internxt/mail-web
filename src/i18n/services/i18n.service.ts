import { initReactI18next } from 'react-i18next';
import i18next from 'i18next';

import dayjs from 'dayjs';
import en from 'dayjs/locale/en';
import es from 'dayjs/locale/es';
import fr from 'dayjs/locale/fr';
import it from 'dayjs/locale/it';

import enJson from '../locales/en.json';
import esJson from '../locales/es.json';
import frJson from '../locales/fr.json';
import itJson from '../locales/it.json';
import { LocalStorageService } from '@/services/local-storage';

const dayJsLocale: Record<string, ILocale> = {
  en,
  es,
  fr,
  it,
};

const deviceLang: string = LocalStorageService.instance.get('i18nextLng') ?? navigator.language.split('-')[0];

dayjs.locale(dayJsLocale[deviceLang] || dayJsLocale['en']);

export default i18next.use(initReactI18next).init({
  resources: {
    en: { translation: enJson },
    es: { translation: esJson },
    fr: { translation: frJson },
    it: { translation: itJson },
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
