export type Translate = (key: string, props?: Record<string, unknown>) => string
export type TranslateArray = (
  key: string,
  props?: Record<string, unknown>,
) => string[]

export enum Locale {
  English = 'en',
  Spanish = 'es',
  French = 'fr',
}
