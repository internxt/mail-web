/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { OauthService } from './oauth.service';
import { UserService } from '../user/user.service';
import { LocalStorageService } from '../local-storage';
import { WEB_AUTH_CONFIG, WEB_AUTH_MESSAGE_TYPES, type WebAuthMessage, type WebAuthParams } from '@/types/oauth';
import { AuthCancelledByUserError, MissingAuthParamsToken, WebAuthProcessingError } from './errors/oauth.errors';
import { getMockedUser } from '@/test-utils/fixtures';

vi.mock('../config', () => ({
  ConfigService: {
    instance: {
      getVariable: (key: string) => {
        const config: Record<string, string> = {
          DRIVE_APP_URL: 'https://drive.internxt.com',
        };
        return config[key] || '';
      },
    },
  },
}));

const mockedUser = getMockedUser();

describe('OAuth Service', () => {
  let service: OauthService;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(UserService.instance, 'getUser').mockResolvedValue(mockedUser as any);

    vi.spyOn(LocalStorageService.instance, 'setToken').mockImplementation(() => {});

    service = OauthService.instance;
  });

  describe('Processing authentication credentials', () => {
    test('when credentials are received, then the mnemonic is decoded from base64', async () => {
      const mnemonic = 'test mnemonic phrase';
      const encodedMnemonic = Buffer.from(mnemonic).toString('base64');
      const encodedNewToken = Buffer.from('test-new-token').toString('base64');

      const params: WebAuthParams = {
        mnemonic: encodedMnemonic,
        newToken: encodedNewToken,
      };

      const result = await (service as any).processWebAuthParams(params);

      expect(result.mnemonic).toBe(mnemonic);
      expect(result.user.mnemonic).toBe(mnemonic);
    });

    test('when credentials are processed, then the token is stored in local storage', async () => {
      const newToken = 'test-new-token-value';
      const encodedNewToken = Buffer.from(newToken).toString('base64');
      const encodedMnemonic = Buffer.from('test mnemonic').toString('base64');

      const setTokenSpy = vi.spyOn(LocalStorageService.instance, 'setToken');

      const params: WebAuthParams = {
        mnemonic: encodedMnemonic,
        newToken: encodedNewToken,
      };

      await (service as any).processWebAuthParams(params);

      expect(setTokenSpy).toHaveBeenCalledWith(newToken);
    });

    test('when credentials are stored, then user data is fetched from the API', async () => {
      const encodedNewToken = Buffer.from('test-new-token').toString('base64');
      const encodedMnemonic = Buffer.from('test mnemonic').toString('base64');

      const getUserSpy = vi.spyOn(UserService.instance, 'getUser');

      const params: WebAuthParams = {
        mnemonic: encodedMnemonic,
        newToken: encodedNewToken,
      };

      await (service as any).processWebAuthParams(params);

      expect(getUserSpy).toHaveBeenCalledTimes(1);
    });

    test('when credentials are fully processed, then complete authentication data is returned', async () => {
      const mnemonic = 'test mnemonic phrase';
      const newToken = 'test-new-token-value';
      const encodedMnemonic = Buffer.from(mnemonic).toString('base64');
      const encodedNewToken = Buffer.from(newToken).toString('base64');

      const params: WebAuthParams = {
        mnemonic: encodedMnemonic,
        newToken: encodedNewToken,
      };

      const result = await (service as any).processWebAuthParams(params);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('newToken', newToken);
      expect(result).toHaveProperty('mnemonic', mnemonic);
      expect(result.user).toHaveProperty('mnemonic', mnemonic);
    });

    test('when user data cannot be retrieved, then an error indicating so is thrown', async () => {
      vi.spyOn(UserService.instance, 'getUser').mockRejectedValue(new Error('API Error'));

      const params: WebAuthParams = {
        mnemonic: Buffer.from('test').toString('base64'),
        newToken: Buffer.from('new-token').toString('base64'),
      };

      await expect((service as any).processWebAuthParams(params)).rejects.toThrow(WebAuthProcessingError);
    });
  });

  describe('Validating authentication parameters', () => {
    test('when all required parameters are provided, then validation passes', () => {
      const params: WebAuthParams = {
        mnemonic: 'test-mnemonic',
        newToken: 'test-token',
      };

      const isValid = (service as any).validateAuthParams(params);

      expect(isValid).toBe(true);
    });

    test('when the mnemonic is missing, then validation fails', () => {
      const params = {
        newToken: 'test-token',
      };

      const isValid = (service as any).validateAuthParams(params);

      expect(isValid).toBe(false);
    });

    test('when the token is missing, then validation fails', () => {
      const params = {
        mnemonic: 'test-mnemonic',
      };

      const isValid = (service as any).validateAuthParams(params);

      expect(isValid).toBe(false);
    });

    test('when no parameters are provided, then validation fails', () => {
      const params = {};

      const isValid = (service as any).validateAuthParams(params);

      expect(isValid).toBe(false);
    });
  });

  describe('Origin security validation', () => {
    test('when the origin is from internxt.com domain, then it is accepted', () => {
      const isValid = (service as any).isValidOrigin('https://drive.internxt.com');

      expect(isValid).toBe(true);
    });

    test('when the origin is from localhost, then it is accepted', () => {
      const isValid = (service as any).isValidOrigin('http://localhost:3000');

      expect(isValid).toBe(true);
    });

    test('when the origin is from an unknown domain, then it is rejected', () => {
      const isValid = (service as any).isValidOrigin('https://malicious-site.com');

      expect(isValid).toBe(false);
    });

    test('when the origin is empty, then it is rejected', () => {
      const isValid = (service as any).isValidOrigin('');

      expect(isValid).toBe(false);
    });
  });

  describe('Handling authentication success messages', () => {
    test('when a success message with valid credentials is received, then authentication completes successfully', () => {
      const mockResolve = vi.fn();
      const mockReject = vi.fn();
      const mockTimeout = setTimeout(() => {}, 1000) as any;

      const payload: WebAuthParams = {
        mnemonic: 'test-mnemonic',
        newToken: 'test-token',
      };

      const message: WebAuthMessage = {
        type: WEB_AUTH_MESSAGE_TYPES.SUCCESS,
        payload,
      };

      (service as any).handleAuthSuccess(message, mockResolve, mockReject, mockTimeout);

      expect(mockResolve).toHaveBeenCalledWith(payload);
      expect(mockReject).not.toHaveBeenCalled();
    });

    test('when a success message has incomplete credentials, then authentication fails', () => {
      const mockResolve = vi.fn();
      const mockReject = vi.fn();
      const mockTimeout = setTimeout(() => {}, 1000) as any;

      const message: WebAuthMessage = {
        type: WEB_AUTH_MESSAGE_TYPES.SUCCESS,
        payload: { mnemonic: 'test' } as any,
      };

      (service as any).handleAuthSuccess(message, mockResolve, mockReject, mockTimeout);

      expect(mockReject).toHaveBeenCalledWith(expect.any(MissingAuthParamsToken));
      expect(mockResolve).not.toHaveBeenCalled();
    });
  });

  describe('Handling authentication error messages', () => {
    test('when an error message with a description is received, then authentication fails with that error', () => {
      const mockReject = vi.fn();
      const mockTimeout = setTimeout(() => {}, 1000) as any;

      const message: WebAuthMessage = {
        type: WEB_AUTH_MESSAGE_TYPES.ERROR,
        error: 'Authentication failed',
      };

      (service as any).handleAuthError(message, mockReject, mockTimeout);

      expect(mockReject).toHaveBeenCalledWith(new Error('Authentication failed'));
    });

    test('when an error message without a description is received, then authentication fails with a default error', () => {
      const mockReject = vi.fn();
      const mockTimeout = setTimeout(() => {}, 1000) as any;

      const message: WebAuthMessage = {
        type: WEB_AUTH_MESSAGE_TYPES.ERROR,
      };

      (service as any).handleAuthError(message, mockReject, mockTimeout);

      expect(mockReject).toHaveBeenCalledWith(new Error('Authentication failed'));
    });
  });

  describe('Decoding base64 parameters', () => {
    test('when a base64-encoded string is received, then it is decoded to plain text', () => {
      const originalText = 'test text with spaces';
      const encoded = Buffer.from(originalText).toString('base64');

      const decoded = (service as any).decodeBase64Param(encoded);

      expect(decoded).toBe(originalText);
    });

    test('when the encoded string contains special characters, then they are preserved after decoding', () => {
      const originalText = 'test!@#$%^&*()_+-=[]{}|;:",.<>?';
      const encoded = Buffer.from(originalText).toString('base64');

      const decoded = (service as any).decodeBase64Param(encoded);

      expect(decoded).toBe(originalText);
    });

    test('when the encoded string contains unicode characters, then they are preserved after decoding', () => {
      const originalText = 'test émojis 😀🎉 and àccénts';
      const encoded = Buffer.from(originalText).toString('base64');

      const decoded = (service as any).decodeBase64Param(encoded);

      expect(decoded).toBe(originalText);
    });
  });

  describe('Popup window positioning', () => {
    test('when the popup is created, then it is centered on the screen', () => {
      Object.defineProperty(window, 'screen', {
        value: {
          width: 1920,
          height: 1080,
        },
        writable: true,
      });

      const { left, top } = (service as any).calculatePopupPosition();

      const expectedLeft = 1920 / 2 - WEB_AUTH_CONFIG.popupWidth / 2;
      const expectedTop = 1080 / 2 - WEB_AUTH_CONFIG.popupHeight / 2;

      expect(left).toBe(expectedLeft);
      expect(top).toBe(expectedTop);
    });

    test('when the screen size changes, then the popup position is recalculated correctly', () => {
      Object.defineProperty(window, 'screen', {
        value: {
          width: 1366,
          height: 768,
        },
        writable: true,
      });

      const { left, top } = (service as any).calculatePopupPosition();

      const expectedLeft = 1366 / 2 - WEB_AUTH_CONFIG.popupWidth / 2;
      const expectedTop = 768 / 2 - WEB_AUTH_CONFIG.popupHeight / 2;

      expect(left).toBe(expectedLeft);
      expect(top).toBe(expectedTop);
    });
  });

  describe('Popup window configuration', () => {
    test('when the popup window is configured, then it includes all required security and layout features', () => {
      const left = 100;
      const top = 200;

      const features = (service as any).buildPopupFeatures(left, top);

      expect(features).toContain(`width=${WEB_AUTH_CONFIG.popupWidth}`);
      expect(features).toContain(`height=${WEB_AUTH_CONFIG.popupHeight}`);
      expect(features).toContain(`left=${left}`);
      expect(features).toContain(`top=${top}`);
      expect(features).toContain('toolbar=no');
      expect(features).toContain('menubar=no');
      expect(features).toContain('location=no');
      expect(features).toContain('status=no');
    });
  });

  describe('Popup closed detection', () => {
    test('when the popup is closed by the user, then authentication is cancelled', () => {
      vi.useFakeTimers();

      const mockReject = vi.fn();
      const mockTimeout = setTimeout(() => {}, 1000) as any;
      const mockPopup = { closed: true } as Window;

      const interval = (service as any).setupPopupClosedChecker(mockPopup, mockReject, mockTimeout);

      // Trigger the interval check
      vi.advanceTimersByTime(WEB_AUTH_CONFIG.popupCheckIntervalMs);

      expect(mockReject).toHaveBeenCalledWith(expect.any(AuthCancelledByUserError));

      clearInterval(interval);
      vi.useRealTimers();
    });
  });

  describe('Building login credentials', () => {
    test('when user data is available, then login credentials are built correctly', () => {
      const user = {
        userId: '123',
        email: 'test@example.com',
        name: 'Test',
        lastname: 'User',
      };
      const mnemonic = 'test mnemonic';
      const newToken = 'test-token';

      const credentials = (service as any).buildLoginCredentials(user, mnemonic, newToken);

      expect(credentials).toHaveProperty('user');
      expect(credentials).toHaveProperty('newToken', newToken);
      expect(credentials).toHaveProperty('mnemonic', mnemonic);
      expect(credentials.user).toHaveProperty('mnemonic', mnemonic);
      expect(credentials.user).toHaveProperty('email', user.email);
    });
  });

  describe('Cleanup', () => {
    test('when cleanup is called, then all resources are cleaned up', () => {
      const mockPopup = {
        closed: false,
        close: vi.fn(),
      };
      const mockListener = vi.fn();

      (service as any).authPopup = mockPopup;
      (service as any).messageListener = mockListener;
      (service as any).popupCheckInterval = setInterval(() => {}, 1000);

      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      (service as any).cleanup();

      expect(mockPopup.close).toHaveBeenCalled();
      expect((service as any).authPopup).toBeNull();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('message', mockListener);
      expect((service as any).messageListener).toBeNull();
      expect((service as any).popupCheckInterval).toBeNull();
    });
  });
});
