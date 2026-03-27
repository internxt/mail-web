import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/user';
import { storageQuery } from './queries/storage/storage.query';
import { mailQuery } from './queries/mail/mail.query';

export const store = configureStore({
  reducer: {
    user: userReducer,
    [storageQuery.reducerPath]: storageQuery.reducer,
    [mailQuery.reducerPath]: mailQuery.reducer,
  },
  middleware: (getDefault) => getDefault().concat(storageQuery.middleware).concat(mailQuery.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
