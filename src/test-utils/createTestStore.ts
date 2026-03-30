import type { UserState } from '@/store/slices/user';
import { configureStore } from '@reduxjs/toolkit';
import userReducer, { initialUserState } from '../store/slices/user';
import { api } from '@/store/api/base';

type PreloadedState = {
  user?: Partial<UserState>;
};

export const createTestStore = (preloaded?: PreloadedState) =>
  configureStore({
    reducer: {
      user: userReducer,
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefault) => getDefault().concat(api.middleware),
    preloadedState: preloaded ? { user: { ...initialUserState, ...preloaded.user } } : undefined,
  });
