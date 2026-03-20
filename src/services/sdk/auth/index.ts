import { LocalStorageService } from '@/services/local-storage';
import { SdkManager } from '..';

export class AuthService {
  public static readonly instance: AuthService = new AuthService();

  public logOut = async (): Promise<void> => {
    const token = LocalStorageService.instance.getToken();
    const authClient = SdkManager.instance.getAuth();
    await authClient.logout(token ?? '');
  };
}
