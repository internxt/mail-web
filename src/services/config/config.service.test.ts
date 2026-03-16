import { describe, expect, vi, beforeEach, test, afterEach } from 'vitest';
import { VariableNotFoundError } from './config.errors';
import notificationsService, { ToastType } from '../notifications';

import { ConfigService } from '.';

const mockFetchResponse = (platforms: Record<string, string>) => {
  global.fetch = vi.fn().mockResolvedValue({
    json: vi.fn().mockResolvedValue({ platforms }),
  });
};

const mockNavigator = (overrides: Partial<Navigator & { userAgentData?: { platform: string } }>) => {
  Object.defineProperty(global, 'navigator', {
    value: { ...overrides },
    writable: true,
    configurable: true,
  });
};

describe('Config Service', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_DRIVE_API_URL', 'https://api-drive.internxt.com');
    vi.stubEnv('VITE_MAIL_API_URL', 'https://api-mail.internxt.com');
    vi.stubEnv('VITE_PAYMENTS_API_URL', 'https://api-payments.internxt.com');
    vi.stubEnv('VITE_CRYPTO_SECRET', 'test-secret');
    vi.stubEnv('VITE_MAGIC_IV', 'test-iv');
    vi.stubEnv('VITE_MAGIC_SALT', 'test-salt');
    vi.stubEnv('VITE_DRIVE_APP_URL', 'https://drive.internxt.com');
    vi.stubEnv('PROD', false);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  const configService = ConfigService.instance;

  describe('Get Variable', () => {
    test('When getting an existing variable, then it should be returned successfully', () => {
      const result = configService.getVariable('DRIVE_API_URL');
      expect(result).toBe('https://api-drive.internxt.com');
    });

    test('When the variable does not exist, then an error indicating so is thrown', () => {
      vi.stubEnv('VITE_DRIVE_API_URL', undefined);

      expect(() => configService.getVariable('DRIVE_API_URL')).toThrow(VariableNotFoundError);
    });
  });

  describe('Checking if the environment is production', () => {
    test('When the environment is not production, then should indicate so', () => {
      expect(configService.isProduction()).toBe(false);
    });

    test('When the environment is production, then should indicate so', () => {
      vi.stubEnv('PROD', true);

      expect(configService.isProduction()).toBe(true);
    });
  });

  describe('Download Desktop App', () => {
    const mockTranslate = vi.fn((key: string) => key);

    test('When the OS is Windows and API returns URL, then it should open the Windows download URL', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(vi.fn());
      mockNavigator({ userAgentData: { platform: 'Windows' } });
      mockFetchResponse({ Windows: 'https://internxt.com/downloads/drive-v2.exe' });

      await configService.downloadDesktopApp(mockTranslate);

      expect(windowOpenSpy).toHaveBeenCalledWith('https://internxt.com/downloads/drive-v2.exe', '_self');
    });

    test('When the OS is macOS and API returns URL, then it should open the macOS download URL', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(vi.fn());
      mockNavigator({ userAgentData: { platform: 'macOS' } });
      mockFetchResponse({ MacOS: 'https://internxt.com/downloads/drive-v2.dmg' });

      await configService.downloadDesktopApp(mockTranslate);

      expect(windowOpenSpy).toHaveBeenCalledWith('https://internxt.com/downloads/drive-v2.dmg', '_self');
    });

    test('When the OS is Linux and API returns URL, then it should open the Linux download URL', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(vi.fn());
      mockNavigator({ userAgentData: { platform: 'Linux' } });
      mockFetchResponse({ Linux: 'https://internxt.com/downloads/drive-v2.deb' });

      await configService.downloadDesktopApp(mockTranslate);

      expect(windowOpenSpy).toHaveBeenCalledWith('https://internxt.com/downloads/drive-v2.deb', '_self');
    });

    test('When the OS is Windows and API does not return URL, then it should use fallback URL', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(vi.fn());
      mockNavigator({ userAgentData: { platform: 'Windows' } });
      mockFetchResponse({});

      await configService.downloadDesktopApp(mockTranslate);

      expect(windowOpenSpy).toHaveBeenCalledWith('https://internxt.com/downloads/drive.exe', '_self');
    });

    test('When the OS is macOS and API does not return URL, then it should use fallback URL', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(vi.fn());
      mockNavigator({ userAgentData: { platform: 'macOS' } });
      mockFetchResponse({});

      await configService.downloadDesktopApp(mockTranslate);

      expect(windowOpenSpy).toHaveBeenCalledWith('https://internxt.com/downloads/drive.dmg', '_self');
    });

    test('When the OS is Linux and API does not return URL, then it should use fallback URL', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(vi.fn());
      mockNavigator({ userAgentData: { platform: 'Linux' } });
      mockFetchResponse({});

      await configService.downloadDesktopApp(mockTranslate);

      expect(windowOpenSpy).toHaveBeenCalledWith('https://internxt.com/downloads/drive.deb', '_self');
    });

    test('When the OS is unknown, then it should show an error notification', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(vi.fn());
      mockNavigator({ userAgent: 'Unknown Device', vendor: '', appVersion: '' });
      mockFetchResponse({});
      const showNotificationSpy = vi.spyOn(notificationsService, 'show');

      await configService.downloadDesktopApp(mockTranslate);

      expect(windowOpenSpy).not.toHaveBeenCalled();
      expect(showNotificationSpy).toHaveBeenCalledWith({
        text: 'errors.downloadingDesktopApp',
        type: ToastType.Error,
      });
    });
  });

  describe('Get Operating System detection', () => {
    test('When userAgentData.platform contains "win", then it should return Windows', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(vi.fn());
      mockNavigator({ userAgentData: { platform: 'Windows' } });
      mockFetchResponse({ Windows: 'https://example.com/windows.exe' });

      await configService.downloadDesktopApp(vi.fn());

      expect(fetch).toHaveBeenCalled();
      expect(windowOpenSpy).toHaveBeenCalledWith('https://example.com/windows.exe', '_self');
    });

    test('When userAgentData is not available but userAgent contains "Windows", then it should return Windows', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(vi.fn());
      mockNavigator({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' });
      mockFetchResponse({ Windows: 'https://example.com/windows.exe' });

      await configService.downloadDesktopApp(vi.fn());

      expect(windowOpenSpy).toHaveBeenCalledWith('https://example.com/windows.exe', '_self');
    });

    test('When userAgentData is not available but userAgent contains "Mac", then it should return macOS', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(vi.fn());
      mockNavigator({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' });
      mockFetchResponse({ MacOS: 'https://example.com/mac.dmg' });

      await configService.downloadDesktopApp(vi.fn());

      expect(windowOpenSpy).toHaveBeenCalledWith('https://example.com/mac.dmg', '_self');
    });

    test('When userAgentData is not available but userAgent contains "Linux", then it should return Linux', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(vi.fn());
      mockNavigator({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' });
      mockFetchResponse({ Linux: 'https://example.com/linux.deb' });

      await configService.downloadDesktopApp(vi.fn());

      expect(windowOpenSpy).toHaveBeenCalledWith('https://example.com/linux.deb', '_self');
    });

    test('When userAgentData is not available but userAgent contains "Android", then it should detect Linux and use Linux download', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(vi.fn());
      mockNavigator({ userAgent: 'Mozilla/5.0 (Linux; Android 10)' });
      mockFetchResponse({ Linux: 'https://example.com/linux.deb' });

      await configService.downloadDesktopApp(vi.fn());

      // Note: Android userAgent contains "Linux" so it matches Linux first
      expect(windowOpenSpy).toHaveBeenCalledWith('https://example.com/linux.deb', '_self');
    });

    test('When userAgentData is not available but userAgent contains "iPhone", then it should show error (no download available)', async () => {
      vi.spyOn(window, 'open').mockImplementation(vi.fn());
      mockNavigator({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)' });
      mockFetchResponse({});
      const showNotificationSpy = vi.spyOn(notificationsService, 'show');

      await configService.downloadDesktopApp(vi.fn((key: string) => key));

      expect(showNotificationSpy).toHaveBeenCalledWith({
        text: 'errors.downloadingDesktopApp',
        type: ToastType.Error,
      });
    });

    test('When only appVersion contains "X11", then it should return UNIX and use Linux download', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(vi.fn());
      mockNavigator({ userAgent: '', vendor: '', appVersion: 'X11; FreeBSD' });
      mockFetchResponse({ Linux: 'https://example.com/linux.deb' });

      await configService.downloadDesktopApp(vi.fn());

      expect(windowOpenSpy).toHaveBeenCalledWith('https://example.com/linux.deb', '_self');
    });
  });
});
