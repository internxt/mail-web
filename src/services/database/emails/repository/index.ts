import { DatabaseService } from '../..';
import { CryptoEmail } from '../crypto';
import type { StoredEmail, EmailFilters, User } from '../../types';

export class EmailRepository {
  constructor(
    private readonly db: DatabaseService,
    private readonly crypto: CryptoEmail,
  ) {}

  async add(email: StoredEmail): Promise<void> {
    const encryptedMail = await this.crypto.encrypt(email.mail);
    await this.db.put({ ...email, mail: encryptedMail });
  }

  async addMany(emails: StoredEmail[]): Promise<void> {
    const encrypted = await Promise.all(
      emails.map(async (e) => ({
        ...e,
        mail: await this.crypto.encrypt(e.mail),
      })),
    );
    await this.db.putMany(encrypted);
  }

  async getById(id: string): Promise<StoredEmail> {
    const record = await this.db.get(id);
    if (!record) throw new Error(`Email ${id} not found`);
    return this.decryptRecord(record);
  }

  async getByFolder(folderId: string, limit?: number): Promise<StoredEmail[]> {
    const records = await this.db.getByFolder(folderId, limit);
    return this.decryptMany(records);
  }

  async getLatestInFolder(folderId: string): Promise<StoredEmail | undefined> {
    const records = await this.db.getByFolder(folderId, 1);
    if (!records.length) return undefined;
    return this.decryptRecord(records[0]);
  }

  async getAll(): Promise<StoredEmail[]> {
    const records = await this.db.getAll();
    return this.decryptMany(records);
  }

  async remove(id: string): Promise<void> {
    await this.db.remove(id);
  }

  async count(): Promise<number> {
    return this.db.count();
  }

  async enforceMax(max: number): Promise<void> {
    const current = await this.db.count();
    if (current > max) {
      await this.db.deleteOldest(current - max);
    }
  }

  async getBatch(
    batchSize: number,
    startCursor?: IDBValidKey,
  ): Promise<{ emails: StoredEmail[]; nextCursor?: IDBValidKey }> {
    const { items, nextCursor } = await this.db.getBatch(batchSize, startCursor);
    const emails = await this.decryptMany(items);
    return { emails, nextCursor };
  }

  async search(filters: EmailFilters): Promise<StoredEmail[]> {
    const records = await this.getBaseResults(filters);
    const filtered = records.filter((email) => this.matchesFilters(email, filters));
    return this.decryptMany(filtered);
  }

  private async getBaseResults(filters: EmailFilters): Promise<StoredEmail[]> {
    if (filters.from) return this.db.getByIndex('byFrom', filters.from);
    if (filters.to) return this.db.getByIndex('byTo', filters.to);
    if (filters.attachmentType) return this.db.getByIndex('byAttachmentType', filters.attachmentType);

    if (filters.dateRange) {
      const range = IDBKeyRange.bound(filters.dateRange.after, filters.dateRange.before);
      return this.db.getByRange('byTime', range);
    }

    return this.db.getAll();
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

  private dateInRange(createdAt: string, range: { after: number; before: number }): boolean {
    const timestamp = new Date(createdAt).getTime();
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
