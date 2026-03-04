import { SdkManager } from '../sdk.service'

export class AuthService {
  public static readonly instance: AuthService = new AuthService()

  /**
   * Checks from user's security details if it has enabled two factor auth
   * @param email The user's email
   * @throws {Error} If auth.securityDetails endpoint fails
   * @returns True if user has enabled two factor auth
   * @async
   **/
  public is2FANeeded = async (email: string): Promise<boolean> => {
    const authClient = SdkManager.instance.getNewAuth()
    const securityDetails = await authClient
      .securityDetails(email)
      .catch((error) => {
        throw new Error(error.message ?? 'Login error')
      })
    return securityDetails.tfaEnabled
  }

  /**
   * Obtains the current logged in user
   *
   * @returns The current user
   */
  public getUser = async () => {
    const usersClient = SdkManager.instance.getUsers()

    const { user } = await usersClient.refreshUser()

    return user
  }

  /**
   * Refreshes user tokens and data
   * @returns The refreshed user data and tokens
   */
  public refreshUserAndTokens = async () => {
    const usersClient = SdkManager.instance.getUsers()
    const refreshResponse = await usersClient.refreshUser()
    return refreshResponse
  }

  /**
   * Refreshes user avatar independently
   */
  public refreshAvatarUser = async (): Promise<{ avatar: string | null }> => {
    const usersClient = SdkManager.instance.getUsers()
    return usersClient.refreshAvatarUser()
  }
}
