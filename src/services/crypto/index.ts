import CryptoJS from 'crypto-js';

import { ConfigService } from '../config';
import { LocalStorageService } from '../local-storage';
import { SdkManager } from '../sdk';
import { EnvVariableNotFoundError } from '@/errors';

interface PassObjectInterface {
  salt?: string | null;
  password: string;
}

export class CryptoService {
  static readonly instance: CryptoService = new CryptoService();

  async getSalt(): Promise<string> {
    const email = LocalStorageService.instance.getUser()?.email;
    const authClient = SdkManager.instance.getAuth(() => undefined);
    const securityDetails = await authClient.securityDetails(email as string);
    return this.decryptTextWithKey(securityDetails.encryptedSalt, ConfigService.instance.getVariable('CRYPTO_SECRET'));
  }

  passToHash(passObject: PassObjectInterface): { salt: string; hash: string } {
    const salt = passObject.salt ? CryptoJS.enc.Hex.parse(passObject.salt) : CryptoJS.lib.WordArray.random(128 / 8);
    const hash = CryptoJS.PBKDF2(passObject.password, salt, { keySize: 256 / 32, iterations: 10000 });
    const hashedObject = {
      salt: salt.toString(),
      hash: hash.toString(),
    };

    return hashedObject;
  }

  private decryptTextWithKey(encryptedText: string, keyToDecrypt: string): string {
    if (!keyToDecrypt) {
      throw new EnvVariableNotFoundError('CRYPTO_SECRET');
    }

    const reb = CryptoJS.enc.Hex.parse(encryptedText);
    const bytes = CryptoJS.AES.decrypt(reb.toString(CryptoJS.enc.Base64), keyToDecrypt);

    return bytes.toString(CryptoJS.enc.Utf8);
  }

  public encryptTextWithKey(textToEncrypt: string): string {
    const bytes = CryptoJS.AES.encrypt(textToEncrypt, ConfigService.instance.getVariable('CRYPTO_SECRET')).toString();
    const text64 = CryptoJS.enc.Base64.parse(bytes);

    return text64.toString(CryptoJS.enc.Hex);
  }
}
