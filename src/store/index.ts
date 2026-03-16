import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/user';
import { storageQuery } from './queries/storage/storage.query';

export const store = configureStore({
  reducer: {
    user: userReducer,
    [storageQuery.reducerPath]: storageQuery.reducer,
  },
  middleware: (getDefault) => getDefault().concat(storageQuery.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
