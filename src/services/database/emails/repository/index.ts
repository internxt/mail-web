import type { DatabaseService } from '../../';
import type { CryptoEmail } from '../crypto';
import { type StoredEmail, type EmailFilters, type User, EMAIL_DB_INDEXES_KEYS } from '../../types';
import { EmailNotFoundError } from '@/errors';

const STORE = 'emails';
const TIME_INDEX = EMAIL_DB_INDEXES_KEYS.byTime;
const FOLDER_TIME_INDEX = EMAIL_DB_INDEXES_KEYS.byFolderIdAndTime;
const ADD_MANY_CHUNK_SIZE = 50;

export class EmailRepository {
  constructor(
    private readonly db: DatabaseService,
    private readonly crypto: CryptoEmail,
  ) {}

  async add(email: StoredEmail): Promise<void> {
    const encryptedMail = await this.crypto.encrypt(email.mail);
    await this.db.put(STORE, { ...email, mail: encryptedMail });
  }

  async addMany(emails: StoredEmail[]): Promise<void> {
    for (let i = 0; i < emails.length; i += ADD_MANY_CHUNK_SIZE) {
      const chunk = emails.slice(i, i + ADD_MANY_CHUNK_SIZE);
      const encrypted = await Promise.all(chunk.map(async (e) => ({ ...e, mail: await this.crypto.encrypt(e.mail) })));
      await this.db.putMany(STORE, encrypted);
    }
  }

  async getById(id: string): Promise<StoredEmail> {
    const record = await this.db.get<StoredEmail>(STORE, id);
    if (!record) throw new EmailNotFoundError(id);
    return this.decryptRecord(record);
  }

  async getAll(): Promise<StoredEmail[]> {
    const records = await this.db.getAll<StoredEmail>(STORE);
    return this.decryptMany(records);
  }

  async remove(id: string): Promise<void> {
    await this.db.remove(STORE, id);
  }

  async count(): Promise<number> {
    return this.db.count(STORE);
  }

  async enforceMax(max: number): Promise<void> {
    const current = await this.db.count(STORE);
    if (current > max) {
      await this.db.deleteOldest(STORE, TIME_INDEX, current - max);
    }
  }

  async getByFolder(
    folderId: string,
    batchSize: number,
    startCursor?: IDBValidKey,
  ): Promise<{ emails: StoredEmail[]; nextCursor?: IDBValidKey }> {
    const { items, nextCursor } = await this.db.getBatchByFolder<StoredEmail>(
      STORE,
      FOLDER_TIME_INDEX,
      folderId,
      batchSize,
      startCursor,
    );
    const emails = await this.decryptMany(items);
    return { emails, nextCursor };
  }

  async getLatestInFolder(folderId: string): Promise<StoredEmail | undefined> {
    const { emails } = await this.getByFolder(folderId, 1);
    return emails[0];
  }

  async getBatch(
    batchSize: number,
    startCursor?: IDBValidKey,
  ): Promise<{ emails: StoredEmail[]; nextCursor?: IDBValidKey }> {
    const { items, nextCursor } = await this.db.getBatch<StoredEmail>(STORE, TIME_INDEX, batchSize, startCursor);
    const emails = await this.decryptMany(items);
    return { emails, nextCursor };
  }

  async search(filters: EmailFilters): Promise<StoredEmail[]> {
    const records = await this.getBaseResults(filters);
    const filtered = records.filter((email) => this.matchesFilters(email, filters));
    return this.decryptMany(filtered);
  }

  private async getBaseResults(filters: EmailFilters): Promise<StoredEmail[]> {
    if (filters.isRead !== undefined) {
      return this.db.getByIndex<StoredEmail>(STORE, EMAIL_DB_INDEXES_KEYS.byRead, filters.isRead ? 1 : 0);
    }
    if (filters.from) return this.db.getByIndex<StoredEmail>(STORE, EMAIL_DB_INDEXES_KEYS.byFrom, filters.from);
    if (filters.to) return this.db.getByIndex<StoredEmail>(STORE, EMAIL_DB_INDEXES_KEYS.byTo, filters.to);
    if (filters.attachmentType) {
      return this.db.getByIndex<StoredEmail>(STORE, EMAIL_DB_INDEXES_KEYS.byAttachmentType, filters.attachmentType);
    }
    if (filters.dateRange) {
      const range = IDBKeyRange.bound(filters.dateRange.after, filters.dateRange.before);
      return this.db.getByRange<StoredEmail>(STORE, TIME_INDEX, range);
    }
    return this.db.getAll<StoredEmail>(STORE);
  }

  private matchesFilters(email: StoredEmail, filters: EmailFilters): boolean {
    const checks: (() => boolean)[] = [];

    if (filters.isRead !== undefined) {
      checks.push(() => email.params.isRead === filters.isRead);
    }
    if (filters.from) {
      checks.push(() => this.userMatchesQuery(email.params.from, filters.from!));
    }
    if (filters.to) {
      checks.push(() => this.userMatchesQuery(email.params.to, filters.to!));
    }
    if (filters.dateRange) {
      checks.push(() => this.dateInRange(email.params.receivedAt, filters.dateRange!));
    }
    if (filters.attachmentType) {
      checks.push(() => email.params.attachmentTypes?.includes(filters.attachmentType!) ?? false);
    }

    return checks.every((check) => check());
  }

  private userMatchesQuery(users: User[], query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return users.some(
      (user) => user.email?.toLowerCase().includes(lowerQuery) || user.name?.toLowerCase().includes(lowerQuery),
    );
  }

  private dateInRange(receivedAt: string, range: { after: number; before: number }): boolean {
    const timestamp = new Date(receivedAt).getTime();
    return timestamp >= range.after && timestamp <= range.before;
  }

  private async decryptRecord(record: StoredEmail): Promise<StoredEmail> {
    const mail = await this.crypto.decrypt(record.mail);
    return { ...record, mail };
  }

  private async decryptMany(records: StoredEmail[]): Promise<StoredEmail[]> {
    return Promise.all(records.map((r) => this.decryptRecord(r)));
  }
}
