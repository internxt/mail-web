import { useCallback } from 'react';
import { LocalStorageService } from '@/services/local-storage';
import { PaymentsService } from '@/services/sdk/payments';
import type { LoginCredentials } from '@/types/oauth';
import { OauthService } from '@/services/oauth/oauth.service';
import { useAppDispatch } from '@/store/hooks';
import { userActions } from '@/store/slices/user';
import { ErrorService } from '@/services/error';
import type { Translate } from '@/i18n';

interface UseWebAuthProps {
  onSuccess?: (token: string) => void;
  translate: Translate;
}

export function useAuth({ onSuccess, translate }: UseWebAuthProps) {
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
        dispatch(userActions.setUserSubscription(userSubscription));
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
    try {
      const credentials = await OauthService.instance.loginWithWeb();

      if (!credentials?.newToken || !credentials?.user) {
        throw new Error(translate('errors.auth.invalidCredentials'));
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
    try {
      const credentials = await OauthService.instance.signupWithWeb();

      if (!credentials?.newToken || !credentials?.user) {
        throw new Error(translate('errors.auth.invalidCredentials'));
      }

      await saveUserSession(credentials);
    } catch (err: unknown) {
      errorHandler(err);
    }
  };

  const errorHandler = useCallback((err: unknown) => {
    let error = translate('errors.auth.genericError');

    if (err instanceof Error) {
      if (err.message.includes('popup blocker')) {
        error = translate('errors.auth.popupBlocked');
      } else if (err.message.includes('cancelled')) {
        error = translate('errors.auth.authCancelled');
      } else if (err.message.includes('timeout')) {
        error = translate('errors.auth.authTimeout');
      } else {
        error = err.message;
      }
    }

    ErrorService.instance.notifyUser(error);
  }, []);

  return {
    handleWebLogin,
    handleWebSignup,
  };
}
