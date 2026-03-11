import { AppView } from '@/routes/paths';
import { LocalStorageKeys, LocalStorageService } from '@/services/local-storage';
import { NavigationService } from '@/services/navigation';
import type { Tier } from '@internxt/sdk/dist/drive/payments/types/tiers';
import type { UserSettings } from '@internxt/sdk/dist/shared/types/userSettings';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { initializeUserThunk, logoutThunk } from './thunks';

export interface UserState {
  isInitializing: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  user?: UserSettings;
  userTier?: Tier;
}

export const initialUserState: UserState = {
  isInitializing: false,
  isAuthenticated: false,
  isInitialized: false,
  user: undefined,
  userTier: undefined,
};

export const userSlice = createSlice({
  name: 'user',
  initialState: initialUserState,
  reducers: {
    initialize: (state: UserState) => {
      state.user = LocalStorageService.instance.getUser() || undefined;
      state.isAuthenticated = !!state.user;
    },
    setIsUserInitialized: (state: UserState, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    setUserTier(state: UserState, action: PayloadAction<Tier>) {
      state.userTier = action.payload;

      LocalStorageService.instance.setTier(action.payload);
    },
    setUser: (state: UserState, action: PayloadAction<UserSettings | undefined>) => {
      state.isAuthenticated = !!action.payload;
      state.user = action.payload;

      LocalStorageService.instance.set(LocalStorageKeys.xUser, JSON.stringify(action.payload));
    },
    resetState: (state: UserState) => {
      LocalStorageService.instance.clearCredentials();
      Object.assign(state, initialUserState);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeUserThunk.pending, (state) => {
        state.isInitializing = true;
      })
      .addCase(initializeUserThunk.fulfilled, (state) => {
        state.isInitializing = false;
      })
      .addCase(initializeUserThunk.rejected, (state) => {
        // const errorMsg = action.payload ? action.payload : '';

        state.isInitializing = false;
        // notificationsService.show({ text: 'User initialization error ' + errorMsg, type: ToastType.Warning });
        NavigationService.instance.navigate(AppView.welcome);
      });

    builder
      .addCase(logoutThunk.pending, () => undefined)
      .addCase(logoutThunk.fulfilled, () => undefined)
      .addCase(logoutThunk.rejected, () => undefined);
  },
});

export const { initialize, resetState, setIsUserInitialized } = userSlice.actions;
export const userActions = userSlice.actions;

export const userThunks = {
  initializeUserThunk,
  logoutThunk,
};

export default userSlice.reducer;
