import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Translate } from '../types'
import { TranslationContext } from './useTranslationContext'

export interface TranslationContextProps {
  translate: Translate
}

interface TranslationProviderProps {
  children: React.ReactNode
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({
  children,
}) => {
  const { t } = useTranslation()

  const value = useMemo(() => ({ translate: t }), [t])
  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  )
}
