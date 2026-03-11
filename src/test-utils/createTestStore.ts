import type { UserState } from '@/store/slices/user';
import { configureStore } from '@reduxjs/toolkit';
import userReducer, { initialUserState } from '../store/slices/user';

type PreloadedState = {
  user?: Partial<UserState>;
};

export const createTestStore = (preloaded?: PreloadedState) =>
  configureStore({
    reducer: {
      user: userReducer,
    },
    preloadedState: preloaded ? { user: { ...initialUserState, ...preloaded.user } } : undefined,
  });
