import type { Translate } from '@/i18n';
import notificationsService, { ToastType } from '../notifications';
import { VariableNotFoundError } from '@/errors';
import {
  APP_VERSION_MATCHERS,
  PLATFORM_MATCHERS,
  UA_MATCHERS,
  type ConfigKeys,
  type OperatingSystem,
  type PlatformMatcher,
} from '@/types/config';
import { ErrorService } from '../error';
import { INTERNXT_BASE_URL } from '@/constants';

const configKeys: Record<keyof ConfigKeys, string> = {
  DRIVE_API_URL: 'VITE_DRIVE_API_URL',
  MAIL_API_URL: 'VITE_MAIL_API_URL',
  PAYMENTS_API_URL: 'VITE_PAYMENTS_API_URL',
  CRYPTO_SECRET: 'VITE_CRYPTO_SECRET',
  MAGIC_IV: 'VITE_MAGIC_IV',
  MAGIC_SALT: 'VITE_MAGIC_SALT',
  DRIVE_APP_URL: 'VITE_DRIVE_APP_URL',
  INTERCOM_PROVIDER_KEY: 'VITE_INTERCOM_PROVIDER_KEY',
};

export class ConfigService {
  public static readonly instance: ConfigService = new ConfigService();

  public getVariable = (key: keyof ConfigKeys): string => {
    const value = import.meta.env[configKeys[key]];
    if (!value) throw new VariableNotFoundError(key);
    return value;
  };

  public isProduction = (): boolean => {
    return import.meta.env.PROD;
  };

  public async downloadDesktopApp(translate: Translate) {
    const download = await this.getDownloadAppUrl();
    if (download) {
      window.open(download, '_self');
    } else {
      notificationsService.show({
        text: translate('errors.downloadingDesktopApp'),
        type: ToastType.Error,
      });
    }
  }

  private matchPlatform(value: string, matchers: PlatformMatcher[]): OperatingSystem | null {
    const normalized = value.toLowerCase();
    const match = matchers.find(({ pattern }) =>
      pattern instanceof RegExp ? pattern.test(normalized) : normalized.includes(pattern),
    );
    return match?.os ?? null;
  }

  private getOperatingSystem(): OperatingSystem {
    const platform = navigator.userAgentData?.platform;
    if (platform) {
      const result = this.matchPlatform(platform, PLATFORM_MATCHERS);
      if (result) return result;
    }

    const ua = navigator.userAgent ?? navigator.vendor ?? window.opera;
    const uaResult = this.matchPlatform(ua, UA_MATCHERS);
    if (uaResult) return uaResult;

    const appVersion = navigator.appVersion ?? '';
    return this.matchPlatform(appVersion, APP_VERSION_MATCHERS) ?? 'Unknown';
  }

  private async getDownloadAppUrl(): Promise<string | null> {
    let fetchDownloadResponse: { platforms?: Record<string, string> } = {};
    try {
      const response = await fetch(`${INTERNXT_BASE_URL}/api/download`, {
        method: 'GET',
      });
      fetchDownloadResponse = await response.json();
    } catch (error) {
      const castedError = ErrorService.instance.castError(error);
      console.warn('Error while fetching download info', castedError);
    }

    switch (this.getOperatingSystem()) {
      case 'Linux':
      case 'UNIX':
        return fetchDownloadResponse?.platforms?.Linux ?? `${INTERNXT_BASE_URL}/downloads/drive.deb`;
      case 'Windows':
        return fetchDownloadResponse?.platforms?.Windows ?? `${INTERNXT_BASE_URL}/downloads/drive.exe`;
      case 'macOS':
        return fetchDownloadResponse?.platforms?.MacOS ?? `${INTERNXT_BASE_URL}/downloads/drive.dmg`;
      default:
        return null;
    }
  }
}
