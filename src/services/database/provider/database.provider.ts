import { deriveDatabaseKey, mnemonicToBytes } from 'internxt-crypto';
import { LocalStorageService } from '@/services/local-storage';
import { EmailRepository } from '../emails/repository';
import { DatabaseService } from '..';
import { CryptoEmail } from '../emails/crypto';
import { MAIL_DB_CONFIG } from '../config';

export class DatabaseProvider {
  private static instance: DatabaseProvider | null = null;

  readonly emails: EmailRepository;
  private readonly db: DatabaseService;

  private constructor(db: DatabaseService, emails: EmailRepository) {
    this.db = db;
    this.emails = emails;
  }

  static async init(): Promise<DatabaseProvider> {
    if (DatabaseProvider.instance) return DatabaseProvider.instance;

    const db = new DatabaseService('index-db', MAIL_DB_CONFIG);
    await db.open();

    const mnemonic = LocalStorageService.instance.getMnemonic();
    if (!mnemonic) throw new Error('Mnemonic not found');
    const indexKey = await deriveDatabaseKey(mnemonicToBytes(mnemonic));
    const crypto = new CryptoEmail(indexKey);

    const emails = new EmailRepository(db, crypto);

    DatabaseProvider.instance = new DatabaseProvider(db, emails);
    return DatabaseProvider.instance;
  }

  static getInstance(): DatabaseProvider {
    if (!DatabaseProvider.instance) {
      throw new Error('DatabaseProvider not initialized');
    }
    return DatabaseProvider.instance;
  }

  destroy(): void {
    this.db.close();
    DatabaseProvider.instance = null;
  }
}
