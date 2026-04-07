import { LocalStorageService } from '@/services/local-storage';
import { DatabaseService } from '..';
import { EMAIL_DB_CONFIG } from '../config';
import { deriveDatabaseKey, mnemonicToBytes } from 'internxt-crypto';
import { EmailRepository } from './repository';
import { CryptoEmail } from './crypto';

export class EmailStorage {
  private databaseInstance: DatabaseService | null = null;
  private emailRepository: EmailRepository | null = null;

  get emails(): EmailRepository {
    if (!this.emailRepository) throw new Error('Email repository not initialized');
    return this.emailRepository;
  }

  async init(userId: string): Promise<void> {
    const mnemonic = LocalStorageService.instance.getMnemonic();
    if (!mnemonic) throw new Error('Mnemonic not found');

    this.databaseInstance = new DatabaseService(userId, EMAIL_DB_CONFIG);
    await this.databaseInstance.open();

    const indexKey = await deriveDatabaseKey(mnemonicToBytes(mnemonic));
    const crypto = new CryptoEmail(indexKey);
    this.emailRepository = new EmailRepository(this.databaseInstance, crypto);
  }

  destroy(): void {
    this.databaseInstance?.close();
    this.databaseInstance = null;
  }
}
