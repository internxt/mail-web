import { useCallback, useState } from 'react';
import { LocalStorageService } from '@/services/local-storage';
import { PaymentsService } from '@/services/sdk/payments';
import type { LoginCredentials } from '@/types/oauth';
import { OauthService } from '@/services/oauth/oauth.service';
import { useAppDispatch } from '@/store/hooks';
import { userActions } from '@/store/slices/user';

interface UseWebAuthProps {
  onSuccess?: (token: string) => void;
  translate: (key: string) => string;
}

export function useAuth({ onSuccess, translate }: UseWebAuthProps) {
  const [webAuthError, setWebAuthError] = useState('');
  const dispatch = useAppDispatch();

  const saveUserSession = useCallback(
    async (credentials: LoginCredentials) => {
      LocalStorageService.instance.saveCredentials(credentials.user, credentials.mnemonic, credentials.newToken);

      dispatch(userActions.setUser(credentials.user));
      try {
        const [userTier, userSubscription] = await Promise.all([
          PaymentsService.instance.getUserTier(),
          PaymentsService.instance.getUserSubscription(),
        ]);

        LocalStorageService.instance.setTier(userTier);
        LocalStorageService.instance.setSubscription(userSubscription);
        dispatch(userActions.setUserTier(userTier));
      } catch (err) {
        console.error('Error getting user subscription and tier:', err);
      }

      onSuccess?.(credentials.newToken);
    },
    [dispatch, onSuccess],
  );

  /**
   * Handles web-based login using popup window
   */
  const handleWebLogin = async () => {
    setWebAuthError('');

    try {
      const credentials = await OauthService.instance.loginWithWeb();

      if (!credentials?.newToken || !credentials?.user) {
        throw new Error(translate('meet.auth.modal.error.invalidCredentials'));
      }

      await saveUserSession(credentials);
    } catch (err: unknown) {
      errorHandler(err);
    }
  };

  /**
   * Handles web-based signup using popup window
   */
  const handleWebSignup = async () => {
    setWebAuthError('');

    try {
      const credentials = await OauthService.instance.signupWithWeb();

      if (!credentials?.newToken || !credentials?.user) {
        throw new Error(translate('meet.auth.modal.error.invalidCredentials'));
      }

      await saveUserSession(credentials);
    } catch (err: unknown) {
      errorHandler(err);
    }
  };

  const errorHandler = useCallback(
    (err: unknown) => {
      if (err instanceof Error) {
        if (err.message.includes('popup blocker')) {
          setWebAuthError(translate('meet.auth.modal.error.popupBlocked'));
        } else if (err.message.includes('cancelled')) {
          setWebAuthError(translate('meet.auth.modal.error.authCancelled'));
        } else if (err.message.includes('timeout')) {
          setWebAuthError(translate('meet.auth.modal.error.authTimeout'));
        } else {
          setWebAuthError(err.message);
        }
      } else {
        setWebAuthError(translate('meet.auth.modal.error.genericError'));
      }
    },
    [setWebAuthError],
  );

  const resetState = useCallback(() => {
    setWebAuthError('');
  }, []);

  return {
    webAuthError,
    handleWebLogin,
    handleWebSignup,
    resetState,
  };
}
