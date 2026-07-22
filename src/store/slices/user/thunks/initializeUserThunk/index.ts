import type { RootState } from '@/store';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { setUser, setUserToken, setIsUserInitialized } from '../..';
import { NavigationService } from '@/services/navigation';
import { AppView } from '@/routes/paths';
import { LocalStorageService } from '@/services/local-storage';
import { auth, TokenStatus } from '@internxt/lib';
import { UserService } from '@/services/user/user.service';
import { ErrorService } from '@/services/error';
import dayjs from 'dayjs';
import { logoutThunk } from '../logOutThunk';

export class UserUnauthorizedError extends Error {
  constructor() {
    super('User is unauthorized');

    Object.setPrototypeOf(this, UserUnauthorizedError.prototype);
  }
}

export const initializeUserThunk = createAsyncThunk<
  void,
  { redirectToLogin: boolean } | undefined,
  { state: RootState }
>('user/initialize', async (_, { dispatch, getState }) => {
  const { user, isAuthenticated } = getState().user;

  if (user && isAuthenticated) {
    const result = await dispatch(refreshUserThunk());

    if (refreshUserThunk.rejected.match(result)) {
      dispatch(logoutThunk());
      return;
    }

    dispatch(setIsUserInitialized(true));
  } else {
    NavigationService.instance.navigate({ id: AppView.Welcome });
  }
});

export const refreshUserThunk = createAsyncThunk<void, { forceRefresh?: boolean } | undefined, { state: RootState }>(
  'user/refresh',
  async ({ forceRefresh } = {}, { dispatch, getState }) => {
    const userToken = LocalStorageService.instance.getToken();
    const currentUser = getState().user.user;

    if (!currentUser || !userToken) throw new UserUnauthorizedError();

    const tokenStatus = auth.validateTokenAndCheckExpiration(userToken);

    const isTokenInvalid = tokenStatus === TokenStatus.INVALID;
    const isTokenExpired = tokenStatus === TokenStatus.EXPIRED;

    const isTokenUnauthorized = isTokenInvalid || isTokenExpired;

    if (isTokenUnauthorized) {
      throw new UserUnauthorizedError();
    }

    const isRefreshRequired = tokenStatus === TokenStatus.REFRESH_REQUIRED;

    try {
      if (isRefreshRequired || forceRefresh) {
        const { user, newToken } = await UserService.instance.refreshUser();

        const { emailVerified, name, lastname, uuid, createdAt } = user;
        const avatar = await UserService.instance.refreshUserAvatar();

        dispatch(
          setUser({
            ...currentUser,
            avatar,
            emailVerified,
            name,
            lastname,
            uuid,
            createdAt: dayjs(createdAt).toDate(),
          }),
        );
        dispatch(setUserToken(newToken));
      }
    } catch (err) {
      const castedError = ErrorService.instance.castError(err);
      console.log('ERROR REFRESHING USER', castedError.message, castedError.requestId);
    }
  },
);
