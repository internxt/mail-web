import en from '../locales/en.json';

type DotNotation<T, Prefix extends string = ''> = {
  [K in keyof T]: T[K] extends string
    ? `${Prefix}${K & string}`
    : T[K] extends string[]
      ? `${Prefix}${K & string}`
      : DotNotation<T[K], `${Prefix}${K & string}.`>;
}[keyof T];

export type TranslationKey = DotNotation<typeof en>;
export type Translate = (key: TranslationKey, props?: Record<string, unknown>) => string;
export type TranslateArray = (key: TranslationKey, props?: Record<string, unknown>) => string[];

export enum Locale {
  English = 'en',
  Spanish = 'es',
  French = 'fr',
}
