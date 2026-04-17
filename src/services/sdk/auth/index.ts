import { LocalStorageKeys, LocalStorageService } from '@/services/local-storage';
import { SdkManager } from '..';
import { CryptoService } from '@/services/crypto';

export class AuthService {
  public static readonly instance: AuthService = new AuthService();

  public areCredentialsCorrect = async (
    password: string,
  ): Promise<{
    areValidCredentials: boolean;
    hashedPassword: string;
  }> => {
    const salt = await CryptoService.instance.getSalt();
    const { hash: hashedPassword } = CryptoService.instance.passToHash({ password, salt });
    const token = LocalStorageService.instance.get(LocalStorageKeys.xNewToken) ?? undefined;
    const authClient = SdkManager.instance.getAuth(() => undefined);
    const areCredentialsCorrect = await authClient.areCredentialsCorrect(hashedPassword, token);

    return {
      areValidCredentials: areCredentialsCorrect,
      hashedPassword,
    };
  };

  public logOut = async (): Promise<void> => {
    const token = LocalStorageService.instance.getToken();
    const authClient = SdkManager.instance.getAuth();
    await authClient.logout(token ?? '');
  };
}
