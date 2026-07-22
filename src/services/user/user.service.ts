import { SdkManager } from '../sdk';

export class UserService {
  public static readonly instance: UserService = new UserService();

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
