import { type UserSettings } from '@internxt/sdk/dist/shared/types/userSettings';

export interface LoginCredentials {
  user: UserSettings;
  newToken: string;
  mnemonic: string;
}

export interface WebAuthParams {
  mnemonic: string;
  newToken: string;
}

export interface WebAuthMessage {
  type: typeof WEB_AUTH_MESSAGE_TYPES.SUCCESS | typeof WEB_AUTH_MESSAGE_TYPES.ERROR;
  payload?: WebAuthParams;
  error?: string;
}

export interface WebAuthConfig {
  popupWidth: number;
  popupHeight: number;
  authTimeoutMs: number;
  popupCheckIntervalMs: number;
  popupName: string;
  authOriginParam: string;
  loginPath: string;
  signupPath: string;
}

export const WEB_AUTH_MESSAGE_TYPES = {
  SUCCESS: 'INTERNXT_AUTH_SUCCESS',
  ERROR: 'INTERNXT_AUTH_ERROR',
} as const;

export const WEB_AUTH_CONFIG: WebAuthConfig = {
  popupWidth: 500,
  popupHeight: 700,
  authTimeoutMs: 5 * 60 * 1000,
  popupCheckIntervalMs: 500,
  popupName: 'InternxtAuth',
  authOriginParam: 'authOrigin=mail',
  loginPath: '/login',
  signupPath: '/new',
};

export const WEB_AUTH_VALID_ORIGINS = ['internxt.com', 'localhost', 'pages.dev'] as const;
