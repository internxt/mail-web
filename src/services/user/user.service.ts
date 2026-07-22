import { SdkManager } from '../sdk';

export class UserService {
  public static readonly instance: UserService = new UserService();

  /**
   * DEPRECATED: Remove this function and use refreshUser
   * Obtains the current logged in user
   *
   * @returns The current user
   */
  public getUser = async () => {
    const usersClient = SdkManager.instance.getUsers();

    const { user } = await usersClient.refreshUser();

    return user;
  };

  /**
   * Refreshes user tokens and data
   * @returns The refreshed user data and tokens
   */
  public refreshUser = async () => {
    const usersClient = SdkManager.instance.getUsers();
    const refreshResponse = await usersClient.refreshUser();
    return refreshResponse;
  };

  /**
   * Refreshes user avatar
   * @returns The refreshed user avatar
   */
  public refreshUserAvatar = async () => {
    const usersClient = SdkManager.instance.getUsers();
    const refreshResponse = await usersClient.refreshAvatarUser();
    return refreshResponse.avatar;
  };
}
