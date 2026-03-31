import { Auth, Drive, Mail } from '@internxt/sdk';
import type { ApiSecurity, AppDetails } from '@internxt/sdk/dist/shared';
import packageJson from '../../../package.json';
import { ConfigService } from '../config';
import { LocalStorageService } from '../local-storage';
import { store } from '@/store';
import { logoutThunk } from '@/store/slices/user/thunks';

export type SdkManagerApiSecurity = ApiSecurity & { newToken: string };

export class SdkManager {
  public static readonly instance: SdkManager = new SdkManager();
  private static apiSecurity?: SdkManagerApiSecurity;

  public static readonly init = (apiSecurity: SdkManagerApiSecurity) => {
    SdkManager.apiSecurity = apiSecurity;
  };

  public static readonly clean = () => {
    SdkManager.apiSecurity = undefined;
  };

  public static readonly getApiSecurity = (
    config = { throwErrorOnMissingCredentials: true },
  ): SdkManagerApiSecurity | undefined => {
    if (!SdkManager.apiSecurity && config.throwErrorOnMissingCredentials)
      throw new Error('Api security properties not found in SdkManager');

    return SdkManager.apiSecurity;
  };

  private getNewTokenApiSecurity(): ApiSecurity {
    return {
      token: LocalStorageService.instance?.getToken() ?? '',
      unauthorizedCallback: async () => {
        await store.dispatch(logoutThunk());
      },
    };
  }

  public static readonly getAppDetails = (): AppDetails => {
    return {
      clientName: packageJson.name,
      clientVersion: packageJson.version,
    };
  };

  getAuth(): Auth {
    const apiSecurity = SdkManager.getApiSecurity({
      throwErrorOnMissingCredentials: false,
    });
    const appDetails = SdkManager.getAppDetails();

    return Auth.client(this.driveApiUrl, appDetails, apiSecurity);
  }

  getUsers(): Drive.Users {
    const apiSecurity = this.getNewTokenApiSecurity();
    const appDetails = SdkManager.getAppDetails();

    return Drive.Users.client(this.driveApiUrl, appDetails, apiSecurity);
  }

  getStorage(): Drive.Storage {
    const apiSecurity = this.getNewTokenApiSecurity();
    const appDetails = SdkManager.getAppDetails();

    return Drive.Storage.client(this.driveApiUrl, appDetails, apiSecurity);
  }

  getPayments(): Drive.Payments {
    const apiSecurity = this.getNewTokenApiSecurity();
    const appDetails = SdkManager.getAppDetails();

    return Drive.Payments.client(this.paymentsApiUrl, appDetails, apiSecurity);
  }

  getMail(): Mail {
    const apiSecurity = this.getNewTokenApiSecurity();
    const appDetails = SdkManager.getAppDetails();

    return Mail.client(this.mailApiUrl, appDetails, apiSecurity);
  }

  get driveApiUrl(): string {
    return ConfigService.instance.getVariable('DRIVE_API_URL');
  }

  get mailApiUrl(): string {
    return ConfigService.instance.getVariable('MAIL_API_URL');
  }

  get paymentsApiUrl(): string {
    return ConfigService.instance.getVariable('PAYMENTS_API_URL');
  }
}
