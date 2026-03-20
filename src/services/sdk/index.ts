import { Auth, Drive } from '@internxt/sdk';
import type { ApiSecurity, AppDetails } from '@internxt/sdk/dist/shared';
import packageJson from '../../../package.json';
import { ConfigService } from '../config';
import { LocalStorageService } from '../local-storage';
import { AuthService } from './auth';
import { NavigationService } from '../navigation';
import { AppView } from '@/routes/paths';

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
      unauthorizedCallback: () => {
        if (LocalStorageService.instance) {
          LocalStorageService.instance.clearCredentials();
          AuthService.instance.logOut().catch((error) => {
            console.error(error);
          });
          NavigationService.instance.navigate({ id: AppView.Welcome });
        }
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

    return Auth.client(this.apiUrl, appDetails, apiSecurity);
  }

  getUsers(): Drive.Users {
    const apiSecurity = this.getNewTokenApiSecurity();
    const appDetails = SdkManager.getAppDetails();

    return Drive.Users.client(this.apiUrl, appDetails, apiSecurity);
  }

  getStorage(): Drive.Storage {
    const apiSecurity = this.getNewTokenApiSecurity();
    const appDetails = SdkManager.getAppDetails();

    return Drive.Storage.client(this.apiUrl, appDetails, apiSecurity);
  }

  getPayments(): Drive.Payments {
    const paymentsApi = ConfigService.instance.getVariable('PAYMENTS_API_URL');

    const apiSecurity = this.getNewTokenApiSecurity();
    const appDetails = SdkManager.getAppDetails();

    return Drive.Payments.client(paymentsApi, appDetails, apiSecurity);
  }

  get apiUrl(): string {
    return ConfigService.instance.getVariable('DRIVE_API_URL');
  }
}
