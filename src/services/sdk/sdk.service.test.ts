import { Auth, Drive, Mail } from '@internxt/sdk';
import { beforeEach, describe, expect, test, vi, afterEach } from 'vitest';
import { SdkManager } from '.';
import { ConfigService } from '../config';
import { LocalStorageService } from '../local-storage';
import { NavigationService } from '../navigation';
import { store } from '@/store';

vi.mock('@/store', () => ({
  store: {
    dispatch: vi.fn(),
  },
}));

vi.mock('./auth', () => ({
  AuthService: {
    instance: {
      logOut: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

vi.mock('@internxt/sdk', () => ({
  Auth: {
    client: vi.fn().mockImplementation((baseUrl, appDetails, security) => ({
      baseUrl,
      appDetails,
      security,
      unauthorizedCallback: vi.fn(),
    })),
  },
  Drive: {
    Users: {
      client: vi.fn().mockImplementation((baseUrl, appDetails, security) => ({
        baseUrl,
        appDetails,
        security,
        unauthorizedCallback: vi.fn(),
      })),
    },
    Storage: {
      client: vi.fn().mockImplementation((baseUrl, appDetails, security) => ({
        baseUrl,
        appDetails,
        security,
        unauthorizedCallback: vi.fn(),
      })),
    },
    Payments: {
      client: vi.fn().mockImplementation((baseUrl, appDetails, security) => ({
        baseUrl,
        appDetails,
        security,
        unauthorizedCallback: vi.fn(),
      })),
    },
  },
  Mail: {
    client: vi.fn().mockImplementation((baseUrl, appDetails, security) => ({
      baseUrl,
      appDetails,
      security,
      unauthorizedCallback: vi.fn(),
    })),
  },
}));

const config: Record<string, string> = {
  DRIVE_API_URL: 'https://api-drive.internxt.com',
  PAYMENTS_API_URL: 'https://api-payments.internxt.com',
  MAIL_API_URL: 'https://api-mail.internxt.com',
};

describe('SDK Manager', () => {
  beforeEach(() => {
    SdkManager.clean();
    localStorage.clear();
    vi.clearAllMocks();

    vi.spyOn(ConfigService.instance, 'getVariable').mockImplementation((key: string) => {
      return config[key] || '';
    });

    vi.spyOn(LocalStorageService.instance, 'getToken').mockReturnValue('mock-token');
    vi.spyOn(LocalStorageService.instance, 'clearCredentials').mockReturnValue();
    NavigationService.instance.init(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Security initialization', () => {
    test('When initializing with API security, then credentials should be stored', () => {
      const mockApiSecurity = {
        token: 'test-token',
        newToken: 'new-test-token',
        userId: 'test-user-id',
      };

      SdkManager.init(mockApiSecurity);
      const storedSecurity = SdkManager.getApiSecurity({
        throwErrorOnMissingCredentials: false,
      });

      expect(storedSecurity).toEqual(mockApiSecurity);
    });

    test('When cleaning the manager, then security credentials should be removed', () => {
      const mockApiSecurity = {
        token: 'test-token',
        newToken: 'new-test-token',
        userId: 'test-user-id',
      };

      SdkManager.init(mockApiSecurity);
      SdkManager.clean();

      const storedSecurity = SdkManager.getApiSecurity({
        throwErrorOnMissingCredentials: false,
      });
      expect(storedSecurity).toBeUndefined();
    });

    test('When requesting credentials without initialization and throwError is true, then should throw error', () => {
      expect(() => SdkManager.getApiSecurity()).toThrow('Api security properties not found in SdkManager');
    });

    test('When requesting credentials without initialization and throwError is false, then should return undefined', () => {
      const result = SdkManager.getApiSecurity({
        throwErrorOnMissingCredentials: false,
      });
      expect(result).toBeUndefined();
    });
  });

  describe('App metadata', () => {
    test('When getting app details, then package information should be returned', () => {
      const appDetails = SdkManager.getAppDetails();

      expect(appDetails).toEqual({
        clientName: 'mail-web',
        clientVersion: expect.any(String),
      });
      expect(appDetails.clientVersion).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('Auth client creation', () => {
    test('When creating Auth client with initialized security, then client should use provided credentials', () => {
      const mockApiSecurity = {
        token: 'test-token',
        newToken: 'new-test-token',
        userId: 'test-user-id',
      };
      SdkManager.init(mockApiSecurity);

      const authClient = SdkManager.instance.getAuth();

      expect(authClient).toBeDefined();
      expect(Auth.client).toHaveBeenCalledWith(
        config.DRIVE_API_URL,
        expect.objectContaining({
          clientName: 'mail-web',
          clientVersion: expect.any(String),
        }),
        mockApiSecurity,
      );
    });

    test('When creating Auth client without initialized security, then client should use undefined credentials', () => {
      const authClient = SdkManager.instance.getAuth();

      expect(authClient).toBeDefined();
      expect(Auth.client).toHaveBeenCalledWith(
        config.DRIVE_API_URL,
        expect.objectContaining({
          clientName: 'mail-web',
        }),
        undefined,
      );
    });
  });

  describe('Users client creation', () => {
    test('When creating Users client, then it should use token from localStorage', () => {
      const usersClient = SdkManager.instance.getUsers();

      expect(usersClient).toBeDefined();
      expect(LocalStorageService.instance.getToken).toHaveBeenCalled();
      expect(Drive.Users.client).toHaveBeenCalledWith(
        config.DRIVE_API_URL,
        expect.objectContaining({
          clientName: 'mail-web',
          clientVersion: expect.any(String),
        }),
        expect.objectContaining({
          token: 'mock-token',
          unauthorizedCallback: expect.any(Function),
        }),
      );
    });

    test('When Users client receives unauthorized response, then logOut should be called', () => {
      SdkManager.instance.getUsers();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const securityArg = (Drive.Users.client as any).mock.calls[0][2];
      securityArg.unauthorizedCallback();

      expect(store.dispatch).toHaveBeenCalled();
    });
  });

  describe('Storage client creation', () => {
    test('When creating Storage client, then it should use token from localStorage', () => {
      const storageClient = SdkManager.instance.getStorage();

      expect(storageClient).toBeDefined();
      expect(LocalStorageService.instance.getToken).toHaveBeenCalled();
      expect(Drive.Storage.client).toHaveBeenCalledWith(
        config.DRIVE_API_URL,
        expect.objectContaining({
          clientName: 'mail-web',
          clientVersion: expect.any(String),
        }),
        expect.objectContaining({
          token: 'mock-token',
          unauthorizedCallback: expect.any(Function),
        }),
      );
    });

    test('When Storage client receives unauthorized response, then logOut should be called', () => {
      SdkManager.instance.getStorage();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const securityArg = (Drive.Storage.client as any).mock.calls[0][2];
      securityArg.unauthorizedCallback();

      expect(store.dispatch).toHaveBeenCalled();
    });
  });

  describe('Payments client creation', () => {
    test('When creating Payments client, then it should use correct API URL and token', () => {
      const paymentsClient = SdkManager.instance.getPayments();

      expect(paymentsClient).toBeDefined();
      expect(LocalStorageService.instance.getToken).toHaveBeenCalled();
      expect(Drive.Payments.client).toHaveBeenCalledWith(
        config.PAYMENTS_API_URL,
        expect.objectContaining({
          clientName: 'mail-web',
          clientVersion: expect.any(String),
        }),
        expect.objectContaining({
          token: 'mock-token',
          unauthorizedCallback: expect.any(Function),
        }),
      );
    });

    test('When Payments client receives unauthorized response, then logOut should be called', () => {
      SdkManager.instance.getPayments();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const securityArg = (Drive.Payments.client as any).mock.calls[0][2];
      securityArg.unauthorizedCallback();

      expect(store.dispatch).toHaveBeenCalled();
    });
  });

  describe('Mail client creation', () => {
    test('When creating Payments client, then it should use correct API URL and token', () => {
      const paymentsClient = SdkManager.instance.getMail();

      expect(paymentsClient).toBeDefined();
      expect(LocalStorageService.instance.getToken).toHaveBeenCalled();
      expect(Mail.client).toHaveBeenCalledWith(
        config.MAIL_API_URL,
        expect.objectContaining({
          clientName: 'mail-web',
          clientVersion: expect.any(String),
        }),
        expect.objectContaining({
          token: 'mock-token',
          unauthorizedCallback: expect.any(Function),
        }),
      );
    });

    test('When Payments client receives unauthorized response, then logOut should be called', () => {
      SdkManager.instance.getMail();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const securityArg = (Mail.client as any).mock.calls[0][2];
      securityArg.unauthorizedCallback();

      expect(store.dispatch).toHaveBeenCalled();
    });
  });
});
