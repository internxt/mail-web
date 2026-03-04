import { useCallback, useState } from 'react'
import { OauthService } from '@/services/auth/oauth.service'
import { LocalStorageService } from '@/services/local-storage'
import { PaymentsService } from '@/services/sdk/payments.service'
import type { LoginCredentials } from '@/types'

interface UseWebAuthProps {
  onClose: () => void
  onLogin?: (token: string) => void
  translate: (key: string) => string
}

export function useAuth({ onClose, onLogin, translate }: UseWebAuthProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [webAuthError, setWebAuthError] = useState('')

  const saveUserSession = useCallback(
    async (credentials: LoginCredentials) => {
      LocalStorageService.instance.saveCredentials(
        credentials.user,
        credentials.mnemonic,
        credentials.newToken,
      )

      try {
        const subscription =
          await PaymentsService.instance.getUserSubscription()
        LocalStorageService.instance.setSubscription(subscription)
      } catch (err) {
        console.error('Error getting user subscription:', err)
      }

      onLogin?.(credentials.newToken)
    },
    [LocalStorageService, onLogin],
  )

  /**
   * Handles web-based login using popup window
   */
  const handleWebLogin = async () => {
    setIsLoggingIn(true)
    setWebAuthError('')

    try {
      const credentials = await OauthService.instance.loginWithWeb()

      if (!credentials?.newToken || !credentials?.user) {
        throw new Error(translate('meet.auth.modal.error.invalidCredentials'))
      }

      await saveUserSession(credentials)
      onClose()
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('popup blocker')) {
          setWebAuthError(translate('meet.auth.modal.error.popupBlocked'))
        } else if (err.message.includes('cancelled')) {
          setWebAuthError(translate('meet.auth.modal.error.authCancelled'))
        } else if (err.message.includes('timeout')) {
          setWebAuthError(translate('meet.auth.modal.error.authTimeout'))
        } else {
          setWebAuthError(err.message)
        }
      } else {
        setWebAuthError(translate('meet.auth.modal.error.genericError'))
      }
    } finally {
      setIsLoggingIn(false)
    }
  }

  /**
   * Handles web-based signup using popup window
   */
  const handleWebSignup = async () => {
    setIsLoggingIn(true)
    setWebAuthError('')

    try {
      const credentials = await OauthService.instance.signupWithWeb()

      if (!credentials?.newToken || !credentials?.user) {
        throw new Error(translate('meet.auth.modal.error.invalidCredentials'))
      }

      await saveUserSession(credentials)
      onClose()
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('popup blocker')) {
          setWebAuthError(translate('meet.auth.modal.error.popupBlocked'))
        } else if (err.message.includes('cancelled')) {
          setWebAuthError(translate('meet.auth.modal.error.authCancelled'))
        } else if (err.message.includes('timeout')) {
          setWebAuthError(translate('meet.auth.modal.error.authTimeout'))
        } else {
          setWebAuthError(err.message)
        }
      } else {
        setWebAuthError(translate('meet.auth.modal.error.genericError'))
      }
    } finally {
      setIsLoggingIn(false)
    }
  }

  const resetState = useCallback(() => {
    setWebAuthError('')
    setIsLoggingIn(false)
  }, [])

  return {
    isLoggingIn,
    webAuthError,
    handleWebLogin,
    handleWebSignup,
    resetState,
  }
}
