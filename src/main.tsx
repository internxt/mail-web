import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { TranslationProvider } from './i18n/index.ts';
import { store } from './store/index.ts';
import { userActions } from './store/slices/user/index.ts';
import { Provider } from 'react-redux';

store.dispatch(userActions.initialize());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TranslationProvider>
      <Provider store={store}>
        <App />
      </Provider>
    </TranslationProvider>
  </StrictMode>,
);
