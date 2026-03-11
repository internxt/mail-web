import { SdkManager } from '..';

export class AuthService {
  public static readonly instance: AuthService = new AuthService();

  public logOut = async (): Promise<void> => {
    const authClient = SdkManager.instance.getAuth();
    return authClient.logout();
  };
}
