import { LocalStorageKeys, LocalStorageService } from '@/services/local-storage';
import type { Tier } from '@internxt/sdk/dist/drive/payments/types/tiers';
import type { UserSettings } from '@internxt/sdk/dist/shared/types/userSettings';
import { beforeEach, describe, test, expect, vi } from 'vitest';
import userReducer, { initialUserState, type UserState, userActions } from '../user';

const mockedUser = {
  name: 'Test',
  uuid: '123',
  email: 'test@example',
} as UserSettings;

const mockedTier = {
  id: 'tier-1',
  label: 'Free',
} as Tier;

describe('User slice', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initializing the user', () => {
    test('When the user is saved in the local storage, then it should be authenticated', () => {
      vi.spyOn(LocalStorageService.instance, 'getUser').mockReturnValue(mockedUser);

      const state = userReducer(initialUserState, userActions.initialize());

      expect(state.user).toStrictEqual(mockedUser);
      expect(state.isAuthenticated).toBeTruthy();
    });

    test('When the user is not saved in the local storage, then it should not be authenticated', () => {
      vi.spyOn(LocalStorageService.instance, 'getUser').mockReturnValue(null);

      const state = userReducer(initialUserState, userActions.initialize());

      expect(state.user).toBeUndefined();
      expect(state.isAuthenticated).toBeFalsy();
    });
  });

  describe('Set if user is initialized', () => {
    test('When set to true, then should indicate that the user is initialized', () => {
      const state = userReducer(initialUserState, userActions.setIsUserInitialized(true));

      expect(state.isInitialized).toBeTruthy();
    });

    test('When set to false, then should indicate that the user is not initialized', () => {
      const previousState: UserState = { ...initialUserState, isInitialized: true };

      const state = userReducer(previousState, userActions.setIsUserInitialized(false));

      expect(state.isInitialized).toBeFalsy();
    });
  });

  describe('Set user', () => {
    test('When a user is set, then it should be authenticated and saved in local storage', () => {
      const setSpy = vi.spyOn(LocalStorageService.instance, 'set');

      const state = userReducer(initialUserState, userActions.setUser(mockedUser));

      expect(state.user).toStrictEqual(mockedUser);
      expect(state.isAuthenticated).toBeTruthy();
      expect(setSpy).toHaveBeenCalledWith(LocalStorageKeys.xUser, JSON.stringify(mockedUser));
    });
  });

  describe('Set User tier', () => {
    test('When a tier is set, then it should be stored in state and saved in local storage', () => {
      const setTierSpy = vi.spyOn(LocalStorageService.instance, 'setTier');

      const state = userReducer(initialUserState, userActions.setUserTier(mockedTier));

      expect(state.userTier).toStrictEqual(mockedTier);
      expect(setTierSpy).toHaveBeenCalledWith(mockedTier);
    });
  });

  describe('Reset state', () => {
    test('When state is reset, then it should clear credentials and return to initial state', () => {
      const clearSpy = vi.spyOn(LocalStorageService.instance, 'clearCredentials');

      const previousState: UserState = {
        ...initialUserState,
        isAuthenticated: true,
        isInitialized: true,
        user: mockedUser,
        userTier: mockedTier,
      };

      const state = userReducer(previousState, userActions.resetState());

      expect(clearSpy).toHaveBeenCalled();
      expect(state).toStrictEqual(initialUserState);
    });
  });
});
