import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Translate, TranslateArray } from '../types';
import { TranslationContext } from './useTranslationContext';

export interface TranslationContextProps {
  translate: Translate;
  translateArray: TranslateArray;
}

interface TranslationProviderProps {
  children: React.ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const { t } = useTranslation();

  const value = useMemo(
    () => ({
      translate: t,
      translateArray: (key: string, options?: Record<string, unknown>) =>
        t(key, { ...options, returnObjects: true }) as string[],
    }),
    [t],
  );

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
};
