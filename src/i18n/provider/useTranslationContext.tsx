import { createContext, useContext } from 'react';
import { type TranslationContextProps } from './TranslationProvider';

export const TranslationContext = createContext<TranslationContextProps>({
  translate: () => '',
});

export const useTranslationContext = (): TranslationContextProps => {
  return useContext(TranslationContext);
};
