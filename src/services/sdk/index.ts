import { Auth, Drive } from '@internxt/sdk'
import type { ApiSecurity, AppDetails } from '@internxt/sdk/dist/shared'
import packageJson from '../../../package.json'
import { ConfigService } from '../config'
import { LocalStorageService } from '../local-storage'

export type SdkManagerApiSecurity = ApiSecurity & { newToken: string }

export class SdkManager {
  public static readonly instance: SdkManager = new SdkManager()
  private static apiSecurity?: SdkManagerApiSecurity
  private readonly localStorage = LocalStorageService

  public static readonly init = (apiSecurity: SdkManagerApiSecurity) => {
    SdkManager.apiSecurity = apiSecurity
  }

  public static readonly clean = () => {
    SdkManager.apiSecurity = undefined
  }

  public static readonly getApiSecurity = (
    config = { throwErrorOnMissingCredentials: true },
  ): SdkManagerApiSecurity | undefined => {
    if (!SdkManager.apiSecurity && config.throwErrorOnMissingCredentials)
      throw new Error('Api security properties not found in SdkManager')

    return SdkManager.apiSecurity
  }

  private getNewTokenApiSecurity(): ApiSecurity {
    return {
      token: this.localStorage.instance?.getToken() ?? '',
      unauthorizedCallback: () => {
        if (this.localStorage.instance) {
          this.localStorage.instance.clearCredentials()
        }
      },
    }
  }

  public static readonly getAppDetails = (): AppDetails => {
    return {
      clientName: packageJson.name,
      clientVersion: packageJson.version,
    }
  }

  getNewAuth() {
    const driveApi = ConfigService.instance.getVariable('DRIVE_API_URL')

    const apiSecurity = SdkManager.getApiSecurity({
      throwErrorOnMissingCredentials: false,
    })
    const appDetails = SdkManager.getAppDetails()

    return Auth.client(driveApi, appDetails, apiSecurity)
  }

  getUsers() {
    const driveApi = ConfigService.instance.getVariable('DRIVE_API_URL')

    const apiSecurity = this.getNewTokenApiSecurity()
    const appDetails = SdkManager.getAppDetails()

    return Drive.Users.client(driveApi, appDetails, apiSecurity)
  }

  getPayments() {
    const paymentsApi = ConfigService.instance.getVariable('PAYMENTS_API_URL')

    const apiSecurity = this.getNewTokenApiSecurity()
    const appDetails = SdkManager.getAppDetails()

    return Drive.Payments.client(paymentsApi, appDetails, apiSecurity)
  }
}
