import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { TranslationProvider } from './i18n/index.ts';
import { store } from './store/index.ts';
import { userActions } from './store/slices/user/index.ts';
import { Provider } from 'react-redux';
import { DialogManagerProvider } from './context/dialog-manager/DialogManager.context.tsx';
import { ThemeProvider } from './context/theme/ThemeProvider.tsx';
import { LiveChatLoaderProvider } from 'react-live-chat-loader';
import { ConfigService } from './services/config/index.ts';

store.dispatch(userActions.hydrate());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LiveChatLoaderProvider
      provider="intercom"
      providerKey={ConfigService.instance.getVariable('INTERCOM_PROVIDER_KEY')}
    >
      <ThemeProvider>
        <TranslationProvider>
          <DialogManagerProvider>
            <Provider store={store}>
              <App />
            </Provider>
          </DialogManagerProvider>
        </TranslationProvider>
      </ThemeProvider>
    </LiveChatLoaderProvider>
  </StrictMode>,
);
