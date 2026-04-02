import { LocalStorageService } from '@/services/local-storage';
import { DatabaseService } from '..';
import { EMAIL_DB_CONFIG } from '../config';
import { deriveDatabaseKey, mnemonicToBytes } from 'internxt-crypto';
import { EmailRepository } from './email.repository';
import { CryptoEmail } from './crypto';

export class EmailDatabase {
  private static databaseInstance: DatabaseService | null = null;

  static async init(userId: string): Promise<void> {
    const mnemonic = LocalStorageService.instance.getMnemonic();
    if (!mnemonic) throw new Error('Mnemonic not found');

    EmailDatabase.databaseInstance = new DatabaseService(userId, EMAIL_DB_CONFIG);
    await EmailDatabase.databaseInstance.open();

    const indexKey = await deriveDatabaseKey(mnemonicToBytes(mnemonic));
    const crypto = new CryptoEmail(indexKey);
    EmailRepository.create(EmailDatabase.databaseInstance, crypto);
  }

  static destroy(): void {
    EmailDatabase.databaseInstance?.close();
    EmailDatabase.databaseInstance = null;
  }
}
