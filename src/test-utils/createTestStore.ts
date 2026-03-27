import type { UserState } from '@/store/slices/user';
import { configureStore } from '@reduxjs/toolkit';
import userReducer, { initialUserState } from '../store/slices/user';
import { storageQuery } from '@/store/queries/storage/storage.query';
import { mailQuery } from '@/store/queries/mail/mail.query';

type PreloadedState = {
  user?: Partial<UserState>;
};

export const createTestStore = (preloaded?: PreloadedState) =>
  configureStore({
    reducer: {
      user: userReducer,
      [storageQuery.reducerPath]: storageQuery.reducer,
      [mailQuery.reducerPath]: mailQuery.reducer,
    },
    middleware: (getDefault) => getDefault().concat(storageQuery.middleware).concat(mailQuery.middleware),
    preloadedState: preloaded ? { user: { ...initialUserState, ...preloaded.user } } : undefined,
  });
